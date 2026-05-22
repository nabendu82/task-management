"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Task, Board, Column } from "../supabase/models";
import { taskService, boardService, columnService } from "../services";
import { useSupabase } from "../supabase/SupabaseProvider";

export function useCalendar() {
    const { user } = useUser();
    const { supabase } = useSupabase();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user && supabase) {
            loadCalendarData();
        }
    }, [user, supabase]);

    async function loadCalendarData() {
        if (!user || !supabase) return;
        try {
            setLoading(true);
            setError(null);
            
            // Get user boards
            const userBoards = await boardService.getBoards(supabase, user.id);
            setBoards(userBoards);

            // Get user tasks
            const userTasks = await taskService.getTasksByUser(supabase, user.id);
            setTasks(userTasks);
        } catch (err) {
            console.error("Failed to load calendar data:", err);
            setError(err instanceof Error ? err.message : "Failed to load calendar data.");
        } finally {
            setLoading(false);
        }
    }

    async function updateTaskDueDate(taskId: string, dueDate: string | null) {
        if (!supabase) return;
        try {
            const updated = await taskService.updateTaskDueDate(supabase, taskId, dueDate);
            setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, due_date: dueDate } : t));
            return updated;
        } catch (err) {
            console.error("Failed to update task date:", err);
            setError(err instanceof Error ? err.message : "Failed to update task date.");
            throw err;
        }
    }

    async function toggleTaskCompletion(taskId: string, isCompleted: boolean) {
        if (!supabase) return;
        try {
            const updated = await taskService.toggleTaskCompletion(supabase, taskId, isCompleted);
            setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, is_completed: isCompleted } : t));
            return updated;
        } catch (err) {
            console.error("Failed to update task completion status:", err);
            setError(err instanceof Error ? err.message : "Failed to update task completion status.");
            throw err;
        }
    }

    async function createTaskOnCalendar(taskData: {
        title: string;
        description?: string;
        assignee?: string;
        dueDate: string;
        priority?: "low" | "medium" | "high";
        columnId: string;
    }) {
        if (!supabase) return;
        try {
            const newTask = await taskService.createTask(supabase, {
                title: taskData.title,
                description: taskData.description || null,
                assignee: taskData.assignee || null,
                due_date: taskData.dueDate,
                column_id: taskData.columnId,
                priority: taskData.priority || "medium",
                sort_order: 0,
                is_completed: false
            });
            setTasks((prev) => [...prev, newTask]);
            return newTask;
        } catch (err) {
            console.error("Failed to create task from calendar:", err);
            setError(err instanceof Error ? err.message : "Failed to create task.");
            throw err;
        }
    }

    async function getColumnsForBoard(boardId: string): Promise<Column[]> {
        if (!supabase) return [];
        try {
            return await columnService.getColumns(supabase, boardId);
        } catch (err) {
            console.error("Failed to load columns for board:", err);
            return [];
        }
    }

    return {
        tasks,
        boards,
        loading,
        error,
        updateTaskDueDate,
        toggleTaskCompletion,
        createTaskOnCalendar,
        getColumnsForBoard,
        refresh: loadCalendarData
    };
}
