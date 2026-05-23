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

            // Get user tasks and default is_completed to false if missing
            const userTasks = await taskService.getTasksByUser(supabase, user.id);
            setTasks(userTasks.map(t => ({ ...t, is_completed: t.is_completed ?? false })));
        } catch (err) {
            console.error("Failed to load calendar data:", err);
            setError(err instanceof Error ? err.message : "Failed to load calendar data.");
        } finally {
            setLoading(false);
        }
    }

    async function updateTaskDueDate(taskId: string, dueDate: string | null) {
        if (!supabase) return;
        const task = tasks.find((t) => t.id.toString() === taskId.toString());
        const originalDueDate = task ? task.due_date : null;
        
        // Optimistically update local state immediately
        setTasks((prev) => prev.map((t) => t.id.toString() === taskId.toString() ? { ...t, due_date: dueDate } : t));
        
        try {
            const updated = await taskService.updateTaskDueDate(supabase, taskId, dueDate);
            return updated;
        } catch (err) {
            console.error("Failed to update task date:", err);
            // Revert state on failure
            setTasks((prev) => prev.map((t) => t.id.toString() === taskId.toString() ? { ...t, due_date: originalDueDate } : t));
            throw err;
        }
    }

    async function reorderCalendarTasks(draggedTaskId: string, targetTaskId: string | null, targetDateStr: string) {
        if (!supabase) return;
        
        const originalTasks = [...tasks];
        
        // Find the task currently being dragged
        const draggedTask = tasks.find(t => t.id.toString() === draggedTaskId.toString());
        if (!draggedTask) return;
        
        // Get all tasks currently scheduled for the target date, ordered by their current sort_order
        // If the dragged task is currently on this date, we filter it out so we can insert it at its new position
        const targetDateTasks = tasks
            .filter(t => t.due_date === targetDateStr && t.id.toString() !== draggedTaskId.toString())
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            
        // Calculate new tasks array for the target date
        let updatedTargetDateTasks = [...targetDateTasks];
        
        if (targetTaskId === null) {
            // Dropped on the container directly, append to the end
            updatedTargetDateTasks.push({ ...draggedTask, due_date: targetDateStr });
        } else {
            // Dropped on a specific task, insert at that task's index
            const targetIndex = targetDateTasks.findIndex(t => t.id.toString() === targetTaskId.toString());
            if (targetIndex === -1) {
                updatedTargetDateTasks.push({ ...draggedTask, due_date: targetDateStr });
            } else {
                updatedTargetDateTasks.splice(targetIndex, 0, { ...draggedTask, due_date: targetDateStr });
            }
        }
        
        // Re-assign contiguous sort_order values for all tasks on this date
        const reorderedTasksWithIndices = updatedTargetDateTasks.map((t, idx) => ({
            ...t,
            sort_order: idx
        }));
        
        // Optimistically update local React state immediately
        setTasks((prev) => {
            const remaining = prev.filter(
                t => t.id.toString() !== draggedTaskId.toString() && t.due_date !== targetDateStr
            );
            return [...remaining, ...reorderedTasksWithIndices];
        });
        
        // Persist to database
        try {
            const taskOrders = reorderedTasksWithIndices.map(t => ({
                id: t.id,
                sort_order: t.sort_order,
                due_date: t.id.toString() === draggedTaskId.toString() ? targetDateStr : undefined
            }));
            await taskService.reorderTasks(supabase, taskOrders);
        } catch (err) {
            console.error("Failed to persist task reordering:", err);
            // Revert state on failure
            setTasks(originalTasks);
            throw err;
        }
    }

    async function toggleTaskCompletion(taskId: string, isCompleted: boolean) {
        if (!supabase) return;
        // Find the task to get its column_id for board sync
        const task = tasks.find(t => t.id.toString() === taskId.toString());
        // Always update local state immediately for instant UI feedback
        setTasks((prev) => prev.map((t) => t.id.toString() === taskId.toString() ? { ...t, is_completed: isCompleted } : t));
        try {
            await taskService.toggleTaskCompletion(supabase, taskId, isCompleted);
            // Sync with board columns: move to Done/To Do
            if (task?.column_id) {
                await taskService.syncTaskColumnOnCompletion(supabase, taskId, task.column_id, isCompleted);
            }
        } catch (err) {
            console.error("Failed to update task completion status:", err);
            // Revert local state on unexpected errors
            setTasks((prev) => prev.map((t) => t.id.toString() === taskId.toString() ? { ...t, is_completed: !isCompleted } : t));
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
                sort_order: 0
            });
            setTasks((prev) => [...prev, { ...newTask, is_completed: newTask.is_completed ?? false }]);
            return newTask;
        } catch (err) {
            console.error("Failed to create task from calendar:", err);
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
        reorderCalendarTasks,
        toggleTaskCompletion,
        createTaskOnCalendar,
        getColumnsForBoard,
        refresh: loadCalendarData
    };
}
