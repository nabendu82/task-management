import { Board } from "@/lib/supabase/models";

export const REPETITIVE_TASKS_BOARD_TITLE = "Repetitive Tasks";
export const REPETITIVE_TASKS_BOARD_DESCRIPTION = "Recurring and repetitive tasks";
export const REPETITIVE_TASKS_BOARD_COLOR = "bg-violet-500";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function isRepetitiveTasksBoard(board: Pick<Board, "title" | "is_repetitive_board"> | null | undefined): boolean {
    if (!board) return false;
    return board.is_repetitive_board === true || board.title === REPETITIVE_TASKS_BOARD_TITLE;
}

export function getRepetitiveTasksBoard(boards: Board[]): Board | undefined {
    return boards.find(isRepetitiveTasksBoard);
}
