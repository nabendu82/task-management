import { Board, Column, Task, TaskSeries, CreateTaskSeriesInput, UpdateTaskSeriesInput } from "@/lib/supabase/models";
import { SupabaseClient } from "@supabase/supabase-js";
import {
    REPETITIVE_TASKS_BOARD_COLOR,
    REPETITIVE_TASKS_BOARD_DESCRIPTION,
    REPETITIVE_TASKS_BOARD_TITLE,
    isRepetitiveTasksBoard,
} from "@/lib/constants";
import { generateOccurrenceDates } from "@/lib/seriesUtils";

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
        const payload: Record<string, unknown> = {
            user_id: board.user_id,
            title: board.title,
            description: board.description,
            color: board.color,
        };
        if (board.is_repetitive_board !== undefined) {
            payload.is_repetitive_board = board.is_repetitive_board;
        }

        const { data, error } = await supabase
            .from("boards")
            .insert(payload)
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
            .order("due_date", { ascending: true })
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return (data || []) as unknown as Task[];
    },
    async reorderTasks(supabase: SupabaseClient, taskOrders: { id: string; sort_order: number; due_date?: string | null }[]): Promise<void> {
        const promises = taskOrders.map((t) => {
            const updates: any = { sort_order: t.sort_order };
            if (t.due_date !== undefined) {
                updates.due_date = t.due_date;
            }
            return supabase
                .from("tasks")
                .update(updates)
                .eq("id", t.id);
        });
        const results = await Promise.all(promises);
        for (const res of results) {
            if (res.error) throw res.error;
        }
    },
    async createTask(supabase: SupabaseClient, task: Omit<Task, "id" | "created_at" | "updated_at" | "is_completed"> & { is_completed?: boolean }): Promise<Task> {
        // Destructure out is_completed so we don't send it to the database
        // (the column may not exist yet). If it does exist, Supabase will default it.
        const { is_completed, ...taskWithoutCompleted } = task as any;

        const { data, error } = await supabase
            .from("tasks")
            .insert(taskWithoutCompleted)
            .select(`
                *,
                columns (
                    board_id
                )
            `)
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
    async updateTask(supabase: SupabaseClient, taskId: string, updates: Partial<Task>): Promise<Task> {
        const { data, error } = await supabase
            .from("tasks")
            .update(updates)
            .eq("id", taskId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
    async markSeriesException(supabase: SupabaseClient, taskId: string): Promise<void> {
        const { error } = await supabase
            .from("tasks")
            .update({ series_exception: true })
            .eq("id", taskId);

        if (error) {
            if (error.code === "PGRST204" || error.message?.includes("series_exception")) {
                return;
            }
            throw error;
        }
    },
    async createTasks(
        supabase: SupabaseClient,
        tasks: Array<Omit<Task, "id" | "created_at">>
    ): Promise<Task[]> {
        if (tasks.length === 0) return [];

        const payload = tasks.map(({ is_completed, ...task }) => task as Omit<Task, "id" | "created_at" | "is_completed">);

        const { data, error } = await supabase
            .from("tasks")
            .insert(payload)
            .select(`
                *,
                columns (
                    board_id
                )
            `);

        if (error) throw error;
        return (data || []).map((task) => ({ ...task, is_completed: task.is_completed ?? false }));
    },
    async deleteSeriesTasks(supabase: SupabaseClient, seriesId: string, includeExceptions = false): Promise<void> {
        let query = supabase.from("tasks").delete().eq("series_id", seriesId);
        if (!includeExceptions) {
            query = query.eq("series_exception", false);
        }
        const { error } = await query;
        if (error) throw error;
    },
    async getTasksBySeries(supabase: SupabaseClient, seriesId: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("series_id", seriesId)
            .order("due_date", { ascending: true });

        if (error) throw error;
        return data || [];
    },
    async updateTasksBySeries(
        supabase: SupabaseClient,
        seriesId: string,
        updates: Partial<Pick<Task, "title" | "description" | "assignee" | "priority">>
    ): Promise<void> {
        const { error } = await supabase
            .from("tasks")
            .update(updates)
            .eq("series_id", seriesId)
            .eq("series_exception", false);

        if (error) throw error;
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

export const seriesService = {
    async getSeries(supabase: SupabaseClient, seriesId: string): Promise<TaskSeries> {
        const { data, error } = await supabase
            .from("task_series")
            .select("*")
            .eq("id", seriesId)
            .single();

        if (error) throw error;
        return data;
    },
    async createSeries(
        supabase: SupabaseClient,
        userId: string,
        input: CreateTaskSeriesInput
    ): Promise<{ series: TaskSeries; tasks: Task[] }> {
        const occurrenceDates = generateOccurrenceDates({
            startDate: input.startDate,
            recurrenceType: input.recurrenceType,
            weekdays: input.weekdays,
            monthDay: input.monthDay,
            endType: input.endType,
            occurrenceCount: input.occurrenceCount,
            endDate: input.endDate || undefined,
        });

        if (occurrenceDates.length === 0) {
            throw new Error("No occurrences generated. Check recurrence settings.");
        }

        const { data: series, error: seriesError } = await supabase
            .from("task_series")
            .insert({
                user_id: userId,
                column_id: input.columnId,
                title: input.title,
                description: input.description || null,
                assignee: input.assignee || null,
                priority: input.priority || "medium",
                recurrence_type: input.recurrenceType,
                weekdays: input.recurrenceType === "weekly" ? input.weekdays : [],
                month_day: input.recurrenceType === "monthly" ? (input.monthDay ?? null) : null,
                start_date: input.startDate,
                end_type: input.endType,
                occurrence_count: input.endType === "count" ? input.occurrenceCount ?? null : null,
                end_date: input.endType === "until" ? input.endDate ?? null : null,
            })
            .select()
            .single();

        if (seriesError) throw seriesError;

        const tasksToCreate = occurrenceDates.map((dueDate, index) => ({
            column_id: input.columnId,
            title: input.title,
            description: input.description || null,
            assignee: input.assignee || null,
            due_date: dueDate,
            priority: input.priority || "medium",
            sort_order: index,
            series_id: series.id,
            series_exception: false,
        }));

        const tasks = await taskService.createTasks(supabase, tasksToCreate);
        return { series, tasks };
    },
    async updateSeries(
        supabase: SupabaseClient,
        seriesId: string,
        input: UpdateTaskSeriesInput
    ): Promise<{ series: TaskSeries; tasks: Task[] }> {
        const existing = await seriesService.getSeries(supabase, seriesId);

        const nextRecurrenceType = input.recurrenceType ?? existing.recurrence_type ?? "weekly";
        const nextWeekdays = input.weekdays ?? existing.weekdays;
        const nextMonthDay = input.monthDay ?? existing.month_day ?? undefined;
        const nextStartDate = input.startDate ?? existing.start_date;
        const nextEndType = input.endType ?? existing.end_type;
        const nextOccurrenceCount = input.occurrenceCount ?? existing.occurrence_count ?? undefined;
        const nextEndDate = input.endDate ?? existing.end_date ?? undefined;

        const scheduleChanged = input.scheduleChanged || (
            input.recurrenceType !== undefined ||
            input.weekdays !== undefined ||
            input.monthDay !== undefined ||
            input.startDate !== undefined ||
            input.endType !== undefined ||
            input.occurrenceCount !== undefined ||
            input.endDate !== undefined
        );

        const seriesUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.title !== undefined) seriesUpdates.title = input.title;
        if (input.description !== undefined) seriesUpdates.description = input.description;
        if (input.assignee !== undefined) seriesUpdates.assignee = input.assignee;
        if (input.priority !== undefined) seriesUpdates.priority = input.priority;
        if (input.columnId !== undefined) seriesUpdates.column_id = input.columnId;
        if (input.recurrenceType !== undefined) seriesUpdates.recurrence_type = input.recurrenceType;
        if (input.weekdays !== undefined) seriesUpdates.weekdays = input.weekdays;
        if (input.monthDay !== undefined) seriesUpdates.month_day = input.monthDay;
        if (input.startDate !== undefined) seriesUpdates.start_date = input.startDate;
        if (input.endType !== undefined) seriesUpdates.end_type = input.endType;
        if (input.occurrenceCount !== undefined) seriesUpdates.occurrence_count = input.occurrenceCount;
        if (input.endDate !== undefined) seriesUpdates.end_date = input.endDate;

        const { data: series, error: seriesError } = await supabase
            .from("task_series")
            .update(seriesUpdates)
            .eq("id", seriesId)
            .select()
            .single();

        if (seriesError) throw seriesError;

        if (scheduleChanged) {
            await taskService.deleteSeriesTasks(supabase, seriesId, false);

            const occurrenceDates = generateOccurrenceDates({
                startDate: nextStartDate,
                recurrenceType: nextRecurrenceType,
                weekdays: nextWeekdays,
                monthDay: nextMonthDay,
                endType: nextEndType,
                occurrenceCount: nextOccurrenceCount,
                endDate: nextEndDate || undefined,
            });

            const tasks = await taskService.createTasks(
                supabase,
                occurrenceDates.map((dueDate, index) => ({
                    column_id: input.columnId ?? existing.column_id,
                    title: input.title ?? existing.title,
                    description: input.description ?? existing.description,
                    assignee: input.assignee ?? existing.assignee,
                    due_date: dueDate,
                    priority: input.priority ?? existing.priority,
                    sort_order: index,
                    series_id: seriesId,
                    series_exception: false,
                }))
            );

            return { series, tasks };
        }

        await taskService.updateTasksBySeries(supabase, seriesId, {
            title: input.title ?? existing.title,
            description: input.description ?? existing.description,
            assignee: input.assignee ?? existing.assignee,
            priority: input.priority ?? existing.priority,
        });

        const tasks = await taskService.getTasksBySeries(supabase, seriesId);
        return { series, tasks };
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
        isRepetitiveBoard?: boolean;
    }) {
        const boardPayload: Omit<Board, "id" | "created_at" | "updated_at"> = {
            user_id: boardData.userId,
            title: boardData.title,
            description: boardData.description || null,
            color: boardData.color || "bg-blue-500",
        };

        if (boardData.isRepetitiveBoard) {
            boardPayload.is_repetitive_board = true;
        }

        let board: Board;
        try {
            board = await boardService.createBoard(supabase, boardPayload);
        } catch (err: any) {
            if (boardData.isRepetitiveBoard && (err?.code === "PGRST204" || err?.message?.includes("is_repetitive_board"))) {
                const { is_repetitive_board, ...fallbackPayload } = boardPayload;
                board = await boardService.createBoard(supabase, fallbackPayload);
            } else {
                throw err;
            }
        }

        const defaultColumns = [
            { title: "To Do", sort_order: 0 },
            { title: "In Progress", sort_order: 1 },
            { title: "Review", sort_order: 2 },
            { title: "Done", sort_order: 3 },
        ];

        await Promise.all(defaultColumns.map(column => columnService.createColumn(supabase, { ...column, board_id: board.id, user_id: boardData.userId })));
        return board;
    },
    async createRepetitiveTasksBoard(supabase: SupabaseClient, userId: string): Promise<Board> {
        return boardDataService.createBoardWithDefaultColumns(supabase, {
            title: REPETITIVE_TASKS_BOARD_TITLE,
            description: REPETITIVE_TASKS_BOARD_DESCRIPTION,
            color: REPETITIVE_TASKS_BOARD_COLOR,
            userId,
            isRepetitiveBoard: true,
        });
    },
    async ensureRepetitiveTasksBoard(supabase: SupabaseClient, userId: string): Promise<Board[]> {
        const boards = await boardService.getBoards(supabase, userId);
        if (boards.some(isRepetitiveTasksBoard)) {
            return boards;
        }

        const repetitiveBoard = await boardDataService.createRepetitiveTasksBoard(supabase, userId);
        return [repetitiveBoard, ...boards];
    }

}
