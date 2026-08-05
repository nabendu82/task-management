export interface Board {
    id: string;
    title: string;
    description: string | null;
    color: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    is_repetitive_board?: boolean;
}

export interface Column {
    id: string;
    board_id: string;
    user_id: string;
    title: string;
    sort_order: number;
    created_at: string;
}

export type ColumnWithTasks = Column & {
    tasks: Task[];
};

export interface Task {
    id: string;
    column_id: string;
    title: string;
    description: string | null;
    assignee: string | null;
    due_date: string | null;
    priority: "low" | "medium" | "high";
    sort_order: number;
    created_at: string;
    is_completed?: boolean;
    series_id?: string | null;
    series_exception?: boolean;
}

export interface TaskSeries {
    id: string;
    user_id: string;
    column_id: string;
    title: string;
    description: string | null;
    assignee: string | null;
    priority: "low" | "medium" | "high";
    recurrence_type: "weekly" | "monthly";
    weekdays: number[];
    month_day: number | null;
    start_date: string;
    end_type: "count" | "until";
    occurrence_count: number | null;
    end_date: string | null;
    created_at: string;
    updated_at: string;
}

export type CreateTaskSeriesInput = {
    columnId: string;
    title: string;
    description?: string | null;
    assignee?: string | null;
    priority?: "low" | "medium" | "high";
    recurrenceType: "weekly" | "monthly";
    weekdays: number[];
    monthDay?: number | null;
    startDate: string;
    endType: "count" | "until";
    occurrenceCount?: number;
    endDate?: string | null;
};

export type UpdateTaskSeriesInput = Partial<CreateTaskSeriesInput> & {
    scheduleChanged?: boolean;
};