"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Board, Column, ColumnWithTasks } from "../supabase/models";
import { boardDataService, boardService, columnService, taskService } from "../services";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useBoards() {
    const { user } = useUser();
    const { supabase } = useSupabase();
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) loadBoards();
    }, [user, supabase]);

    async function loadBoards() {
        if (!user) return;
        try {
            setLoading(true);
            setError(null);
            const data = await boardService.getBoards(supabase!, user.id);
            setBoards(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load boards.");
        } finally {
            setLoading(false);
        }
    }

    async function createBoard(boardData: { title: string, description?: string, color?: string }) {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const newBoard = await boardDataService.createBoardWithDefaultColumns(supabase!, { ...boardData, userId: user.id });
            setBoards((prev) => [newBoard, ...prev]);
        } catch (error) {
            console.error("Failed to create board:", error);
            setError("Failed to create board");
        } finally {
            setLoading(false);
        }
    }

    return { boards, loading, error, createBoard }
}

export function useBoard(boardId: string) {
    const { supabase } = useSupabase();
    const { user } = useUser();
    const [board, setBoard] = useState<Board | null>(null);
    const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (boardId) {
            loadBoard();
        }
    }, [boardId, supabase]);

    async function loadBoard() {
        if (!boardId) return;

        try {
            setLoading(true);
            setError(null);
            const data = await boardDataService.getBoardWithColumns(supabase!, boardId);
            setBoard(data.board);
            setColumns(data.columnsWithTasks);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load boards.");
        } finally {
            setLoading(false);
        }
    }

    async function updateBoard(boardId: string, updates: Partial<Board>) {
        try {
            const updatedBoard = await boardService.updateBoard(supabase!, boardId, updates);
            setBoard(updatedBoard);
            return updatedBoard;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update the board.");
        }
    }

    async function createRealTask(columnId: string, taskData: { title: string; description?: string; assignee?: string; dueDate?: string; priority?: "low" | "medium" | "high"; }) {
        try {
            const newTask = await taskService.createTask(supabase!, {
                title: taskData.title,
                description: taskData.description || null,
                assignee: taskData.assignee || null,
                due_date: taskData.dueDate || null,
                column_id: columnId,
                sort_order: columns.find((col) => col.id === columnId)?.tasks.length || 0,
                priority: taskData.priority || "medium",
            });

            setColumns((prev) => prev.map((col) => col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col));
            return newTask;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create the task.");
        }
    }

    async function createColumn(title: string) {
        if (!user || !board) return;
        try {
            const newColumn = await columnService.createColumn(supabase!, {
                title,
                board_id: board.id,
                user_id: user.id,
                sort_order: columns.length,
            });
            setColumns((prev) => [...prev, { ...newColumn, tasks: [] }]);
            return newColumn;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create column.");
        }
    }

    async function moveTask(taskId: string, newColumnId: string, newOrder: number) {
        try {
            await taskService.moveTask(supabase!, taskId, newColumnId, newOrder);
            setColumns((prev) => {
                const newColumns = prev.map((col) => ({ ...col, tasks: col.tasks.filter((task) => task.id !== taskId) }));
                const task = prev.flatMap((col) => col.tasks).find((t) => t.id === taskId);
                if (task) {
                    return newColumns.map((col) => {
                        if (col.id === newColumnId) {
                            const updatedTasks = [...col.tasks];
                            updatedTasks.splice(newOrder, 0, { ...task, column_id: newColumnId, sort_order: newOrder });
                            return { ...col, tasks: updatedTasks };
                        }
                        return col;
                    });
                }
                return newColumns;
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to move task.");
        }
    }

    async function updateColumn(columnId: string, title: string) {
        try {
            const updatedColumn = await columnService.updateColumn(supabase!, columnId, title);
            setColumns((prev) => prev.map((col) => col.id === columnId ? { ...col, title: updatedColumn.title } : col));
            return updatedColumn;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update column.");
        }
    }

    return { board, columns, loading, error, updateBoard, createRealTask, createColumn, setColumns, moveTask, updateColumn }
}