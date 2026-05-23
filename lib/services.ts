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
            .order("due_date", { ascending: true, nullsFirst: false })
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
    /**
     * Sync task completion with board columns:
     * - When completing: move to the last column ("Done") of the task's board
     * - When uncompleting: move back to the first column ("To Do") of the task's board
     */
    async syncTaskColumnOnCompletion(supabase: SupabaseClient, taskId: string, columnId: string, isCompleted: boolean): Promise<void> {
        try {
            // Get the board_id from the task's current column
            const { data: colData, error: colError } = await supabase
                .from("columns")
                .select("board_id")
                .eq("id", columnId)
                .single();

            if (colError || !colData) return;

            // Get all columns for this board sorted by sort_order
            const { data: boardColumns, error: boardColError } = await supabase
                .from("columns")
                .select("*")
                .eq("board_id", colData.board_id)
                .order("sort_order", { ascending: true });

            if (boardColError || !boardColumns || boardColumns.length === 0) return;

            // Find target column: last column for completion, first column for uncomplete
            const targetColumn = isCompleted
                ? boardColumns[boardColumns.length - 1]  // "Done" = last column
                : boardColumns[0];                         // "To Do" = first column

            // Only move if the task isn't already in the target column
            if (targetColumn.id === columnId) return;

            // Move task to the target column (at the end)
            await supabase
                .from("tasks")
                .update({ column_id: targetColumn.id, sort_order: 9999 })
                .eq("id", taskId);
        } catch (err) {
            console.error("Failed to sync task column on completion:", err);
            // Non-critical — don't throw, just log
        }
    },
};

export const boardDataService = {
    async getBoardWithColumns(supabase: SupabaseClient, boardId: string) {
        const [board, columns] = await Promise.all([boardService.getBoard(supabase, boardId), columnService.getColumns(supabase, boardId)]);
        if (!board) throw new Error("Board not found");

        const tasks = await taskService.getTasksByBoard(supabase, boardId);
        const columnsWithTasks = columns.map((column) => ({
            ...column,
            tasks: tasks
                .filter((task) => task.column_id === column.id)
                .sort((a, b) => {
                    // Sort by due_date ascending, nulls last
                    if (!a.due_date && !b.due_date) return a.sort_order - b.sort_order;
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    const dateCompare = a.due_date.localeCompare(b.due_date);
                    return dateCompare !== 0 ? dateCompare : a.sort_order - b.sort_order;
                }),
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
