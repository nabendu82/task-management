import { Board, Column, Task } from "@/lib/supabase/models";
import { SupabaseClient } from "@supabase/supabase-js";

export const boardService = {
    async getBoard(supabase: SupabaseClient, boardId: string): Promise<Board> {
        const { data, error } = await supabase
            .from("boards")
            .select("*")
            .eq("id", boardId)
            .single();

        if (error) throw error;

        return data;
    },
    async getBoards(supabase: SupabaseClient, userId: string): Promise<Board[]> {
        const { data, error } = await supabase
            .from("boards")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return data || [];
    },
    async createBoard(supabase: SupabaseClient, board: Omit<Board, "id" | "created_at" | "updated_at">): Promise<Board> {
        const { data, error } = await supabase
            .from("boards")
            .insert(board)
            .select()
            .single();

        if (error) throw error;

        return data;
    },
    async updateBoard(supabase: SupabaseClient, boardId: string, updates: Partial<Board>): Promise<Board> {
        const { data, error } = await supabase
            .from("boards")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", boardId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
}

export const columnService = {
    async getColumns(supabase: SupabaseClient, boardId: string): Promise<Column[]> {
        const { data, error } = await supabase
            .from("columns")
            .select("*")
            .eq("board_id", boardId)
            .order("sort_order", { ascending: true });

        if (error) throw error;

        return data || [];
    },
    async createColumn(supabase: SupabaseClient, column: Omit<Column, "id" | "created_at">): Promise<Column> {
        const { data, error } = await supabase
            .from("columns")
            .insert(column)
            .select()
            .single();

        if (error) throw error;

        return data;
    },
    async updateColumn(supabase: SupabaseClient, columnId: string, title: string): Promise<Column> {
        const { data, error } = await supabase
            .from("columns")
            .update({ title })
            .eq("id", columnId)
            .select()
            .single();

        if (error) throw error;

        return data;
    }
}

export const taskService = {
    async getTasksByBoard(supabase: SupabaseClient, boardId: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from("tasks")
            .select(`
                *,
                columns!inner(board_id)
            `)
            .eq("columns.board_id", boardId)
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return data || [];
    },
    async getTasksByUser(supabase: SupabaseClient, userId: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from("tasks")
            .select(`
                *,
                columns!inner(
                    board_id,
                    boards!inner(user_id)
                )
            `)
            .eq("columns.boards.user_id", userId)
            .order("due_date", { ascending: true });

        if (error) throw error;
        return (data || []) as unknown as Task[];
    },
    async createTask(supabase: SupabaseClient, task: Omit<Task, "id" | "created_at" | "updated_at" | "is_completed"> & { is_completed?: boolean }): Promise<Task> {
        // Destructure out is_completed so we don't send it to the database
        // (the column may not exist yet). If it does exist, Supabase will default it.
        const { is_completed, ...taskWithoutCompleted } = task as any;

        const { data, error } = await supabase
            .from("tasks")
            .insert(taskWithoutCompleted)
            .select()
            .single();

        if (error) throw error;
        // Ensure is_completed is present on the returned object for the UI
        return { ...data, is_completed: data.is_completed ?? false };
    },
    async moveTask(supabase: SupabaseClient, taskId: string, newColumnId: string, newOrder: number) {
        const { data, error } = await supabase
            .from("tasks")
            .update({
                column_id: newColumnId,
                sort_order: newOrder,
            })
            .eq("id", taskId);

        if (error) throw error;
        return data;
    },
    async updateTaskDueDate(supabase: SupabaseClient, taskId: string, dueDate: string | null): Promise<Task> {
        const { data, error } = await supabase
            .from("tasks")
            .update({ due_date: dueDate })
            .eq("id", taskId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
    async toggleTaskCompletion(supabase: SupabaseClient, taskId: string, isCompleted: boolean): Promise<Task | null> {
        // Try to update is_completed in the database.
        // If the column doesn't exist yet, silently return null
        // and the caller will handle it with local state only.
        const { data, error } = await supabase
            .from("tasks")
            .update({ is_completed: isCompleted })
            .eq("id", taskId)
            .select()
            .single();

        if (error) {
            if (error.code === "PGRST204" || (error.message && error.message.includes("is_completed"))) {
                // Column doesn't exist yet — completion will only be tracked in local state
                console.warn("is_completed column not found in database. Completion tracked locally only.");
                return null;
            }
            throw error;
        }
        return data;
    },
};

export const boardDataService = {
    async getBoardWithColumns(supabase: SupabaseClient, boardId: string) {
        const [board, columns] = await Promise.all([boardService.getBoard(supabase, boardId), columnService.getColumns(supabase, boardId)]);
        if (!board) throw new Error("Board not found");

        const tasks = await taskService.getTasksByBoard(supabase, boardId);
        const columnsWithTasks = columns.map((column) => ({
            ...column,
            tasks: tasks.filter((task) => task.column_id === column.id),
        }));

        return { board, columnsWithTasks };
    },
    async createBoardWithDefaultColumns(supabase: SupabaseClient, boardData: {
        title: string;
        description?: string;
        color?: string;
        userId: string;
    }) {
        const board = await boardService.createBoard(supabase, {
            user_id: boardData.userId,
            title: boardData.title,
            description: boardData.description || null,
            color: boardData.color || "bg-blue-500"
        })
        const defaultColumns = [
            { title: "To Do", sort_order: 0 },
            { title: "In Progress", sort_order: 1 },
            { title: "Review", sort_order: 2 },
            { title: "Done", sort_order: 3 },
        ];

        await Promise.all(defaultColumns.map(column => columnService.createColumn(supabase, { ...column, board_id: board.id, user_id: boardData.userId })));
        return board;
    }

}
