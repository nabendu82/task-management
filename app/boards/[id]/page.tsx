"use client";

import Navbar from "@/components/navbar";
import SeriesSchedulerFields from "@/components/SeriesSchedulerFields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBoard } from "@/lib/hooks/useBoards";
import { ColumnWithTasks, Task, TaskSeries } from "@/lib/supabase/models";
import { isRepetitiveTasksBoard } from "@/lib/constants";
import { DEFAULT_SERIES_WEEKDAYS, SeriesEndType } from "@/lib/seriesUtils";
import { BOARD_COLOR_PALETTE } from "@/lib/utils";
import { Calendar, MoreHorizontal, Plus, Pointer, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent, PointerSensor, rectIntersection, useDroppable, useSensor, useSensors, } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function DroppableColumn({ column, children, onCreateTask, onEditColumn, isCreateTaskOpen, onCreateTaskOpenChange, seriesFields, submitLabel }:
    { column: ColumnWithTasks; children: React.ReactNode; onCreateTask: (taskData: any) => Promise<void>; onEditColumn: (column: ColumnWithTasks) => void; isCreateTaskOpen: boolean; onCreateTaskOpenChange: (open: boolean) => void; seriesFields?: React.ReactNode; submitLabel?: string; }) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
    return (
        <div ref={setNodeRef} className={`w-full lg:flex-shrink-0 lg:w-80 ${isOver ? "bg-blue-50 rounded-lg" : ""}`}>
            <div className={`bg-white rounded-lg shadow-sm border ${isOver ? "ring-2 ring-blue-300" : ""}`} >
                <div className="p-3 sm:p-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {column.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {column.tasks.length}
                            </Badge>
                        </div>
                        <Button variant="ghost" size="sm" className="flex-shrink-0" onClick={() => onEditColumn(column)}>
                            <MoreHorizontal />
                        </Button>
                    </div>
                </div>

                {/* column content */}
                <div className="p-2">
                    {children}
                    <Dialog open={isCreateTaskOpen} onOpenChange={onCreateTaskOpenChange}>
                        <DialogTrigger render={<Button variant="ghost" className="w-full mt-3 text-gray-500 hover:text-gray-700" />}>
                            <Plus />
                            Add Task
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                                <p className="text-sm text-gray-600">Add a task to the board</p>
                            </DialogHeader>
                            <form className="space-y-4" onSubmit={onCreateTask}>
                                <div className="space-y-2">
                                    <Label>Title *</Label>
                                    <Input id="title" name="title" placeholder="Enter task title" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea id="description" name="description" placeholder="Enter task description" rows={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Assignee</Label>
                                    <Input id="assignee" name="assignee" placeholder="Who should do this?" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select name="priority" defaultValue="medium">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["low", "medium", "high"].map((priority, key) => (
                                                <SelectItem key={key} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date</Label>
                                    <Input type="date" id="dueDate" name="dueDate" />
                                </div>
                                {seriesFields}
                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button type="submit">{submitLabel || "Create Task"}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}

function SortableTask({ task, onEditTask }: { task: Task; onEditTask: (task: Task) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id: task.id });
    const styles = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, };
    function getPriorityColor(priority: "low" | "medium" | "high"): string {
        switch (priority) {
            case "high":
                return "bg-red-500";
            case "medium":
                return "bg-yellow-500";
            case "low":
                return "bg-green-500";
            default:
                return "bg-yellow-500";
        }
    }
    return (
        <div ref={setNodeRef} style={styles} {...listeners} {...attributes}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                        {/* Task Header */}
                        <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">{task.title}</h4>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 flex-shrink-0"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTask(task);
                                }}
                            >
                                <MoreHorizontal className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                            </Button>
                        </div>
                        {/* Task Description */}
                        <p className="text-xs text-gray-600 line-clamp-2">{task.description || "No description."}</p>
                        {/* Task Meta */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                                {task.assignee && (
                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <User className="h-3 w-3" />
                                        <span className="truncate">{task.assignee}</span>
                                    </div>
                                )}
                                {task.due_date && (
                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        <span className="truncate">{task.due_date}</span>
                                    </div>
                                )}
                            </div>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function TaskOverlay({ task }: { task: Task }) {
    function getPriorityColor(priority: "low" | "medium" | "high"): string {
        switch (priority) {
            case "high":
                return "bg-red-500";
            case "medium":
                return "bg-yellow-500";
            case "low":
                return "bg-green-500";
            default:
                return "bg-yellow-500";
        }
    }
    return (
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                    {/* Task Header */}
                    <div className="flex items-start justify-between">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 min-w-0 pr-2">
                            {task.title}
                        </h4>
                    </div>

                    {/* Task Description */}
                    <p className="text-xs text-gray-600 line-clamp-2">
                        {task.description || "No description."}
                    </p>

                    {/* Task Meta */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
                            {task.assignee && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <User className="h-3 w-3" />
                                    <span className="truncate">{task.assignee}</span>
                                </div>
                            )}
                            {task.due_date && (
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span className="truncate">{task.due_date}</span>
                                </div>
                            )}
                        </div>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BoardPage() {
    const { id } = useParams<{ id: string }>();
    const { board, createColumn, updateBoard, columns, createRealTask, createTaskSeries, updateRealTask, updateTaskSeries, getTaskSeries, setColumns, moveTask, updateColumn } = useBoard(id);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newColor, setNewColor] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCreatingColumn, setIsCreatingColumn] = useState(false);
    const [isEditingColumn, setIsEditingColumn] = useState(false);
    const [newColumnTitle, setNewColumnTitle] = useState("");
    const [editingColumnTitle, setEditingColumnTitle] = useState("");
    const [editingColumn, setEditingColumn] = useState<ColumnWithTasks | null>(null);
    const [filters, setFilters] = useState({ priority: [] as string[], assignee: [] as string[], dueDate: null as string | null, });
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [createTaskColumnId, setCreateTaskColumnId] = useState<string | null>(null);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editScope, setEditScope] = useState<"choose" | "individual" | "series" | null>(null);
    const [editingSeries, setEditingSeries] = useState<TaskSeries | null>(null);
    const [isSeriesEnabled, setIsSeriesEnabled] = useState(false);
    const [seriesWeekdays, setSeriesWeekdays] = useState<number[]>(DEFAULT_SERIES_WEEKDAYS);
    const [seriesEndType, setSeriesEndType] = useState<SeriesEndType>("count");
    const [seriesOccurrenceCount, setSeriesOccurrenceCount] = useState(30);
    const [seriesEndDate, setSeriesEndDate] = useState("");
    const [seriesStartDate, setSeriesStartDate] = useState("");

    const isRepetitiveBoard = isRepetitiveTasksBoard(board);

    function resetSeriesFields() {
        setSeriesWeekdays(DEFAULT_SERIES_WEEKDAYS);
        setSeriesEndType("count");
        setSeriesOccurrenceCount(30);
        setSeriesEndDate("");
        setSeriesStartDate(new Date().toISOString().slice(0, 10));
        setIsSeriesEnabled(isRepetitiveBoard);
    }

    useEffect(() => {
        if (isRepetitiveBoard) {
            resetSeriesFields();
        }
    }, [board?.id, isRepetitiveBoard]);

    function renderSeriesSchedulerFields() {
        if (!isRepetitiveBoard) return null;
        return (
            <SeriesSchedulerFields
                enabled={isSeriesEnabled}
                onEnabledChange={setIsSeriesEnabled}
                weekdays={seriesWeekdays}
                onWeekdaysChange={setSeriesWeekdays}
                endType={seriesEndType}
                onEndTypeChange={setSeriesEndType}
                occurrenceCount={seriesOccurrenceCount}
                onOccurrenceCountChange={setSeriesOccurrenceCount}
                endDate={seriesEndDate}
                onEndDateChange={setSeriesEndDate}
            />
        );
    }

    const createTaskSubmitLabel = isRepetitiveBoard && isSeriesEnabled ? "Create Series" : "Create Task";
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8, }, }));

    function handleFilterChange(type: "priority" | "assignee" | "dueDate", value: string | string[] | null) {
        setFilters((prev) => ({ ...prev, [type]: value, }));
    }

    function clearFilters() {
        setFilters({ priority: [] as string[], assignee: [] as string[], dueDate: null as string | null, });
    }

    async function handleUpdateBoard(e: React.FormEvent) {
        e.preventDefault();
        if (!newTitle.trim() || !board) return;

        try {
            await updateBoard(board.id, { title: newTitle.trim(), description: newDescription.trim() || null, color: newColor || board.color });
            setIsEditingTitle(false);
        } catch { }
    }

    function closeEditDialog() {
        setEditingTask(null);
        setEditScope(null);
        setEditingSeries(null);
    }

    async function openEditDialog(task: Task) {
        setEditingTask(task);
        if (task.series_id && !task.series_exception) {
            setEditScope("choose");
            setEditingSeries(null);
        } else {
            setEditScope("individual");
            setEditingSeries(null);
        }
    }

    async function startSeriesEdit(task: Task) {
        if (!task.series_id) return;
        try {
            const series = await getTaskSeries(task.series_id);
            setEditingSeries(series);
            setEditScope("series");
            setSeriesWeekdays(series.weekdays);
            setSeriesEndType(series.end_type);
            setSeriesOccurrenceCount(series.occurrence_count ?? 30);
            setSeriesEndDate(series.end_date ?? "");
        } catch (err) {
            console.error("Failed to load task series:", err);
            setEditScope("individual");
        }
    }

    async function handleUpdateTaskSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editingTask) return;

        const formData = new FormData(e.currentTarget);
        const updates = {
            title: (formData.get("title") as string).trim(),
            description: (formData.get("description") as string)?.trim() || null,
            assignee: (formData.get("assignee") as string)?.trim() || null,
            due_date: (formData.get("dueDate") as string) || null,
            priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
        };

        if (updates.title) {
            if (editScope === "series" && editingTask.series_id && editingSeries) {
                await updateTaskSeries(editingTask.series_id, {
                    title: updates.title,
                    description: updates.description,
                    assignee: updates.assignee,
                    priority: updates.priority,
                    columnId: editingSeries.column_id,
                    weekdays: seriesWeekdays,
                    startDate: editingSeries.start_date,
                    endType: seriesEndType,
                    occurrenceCount: seriesOccurrenceCount,
                    endDate: seriesEndDate || null,
                    scheduleChanged:
                        JSON.stringify(seriesWeekdays) !== JSON.stringify(editingSeries.weekdays) ||
                        seriesEndType !== editingSeries.end_type ||
                        seriesOccurrenceCount !== (editingSeries.occurrence_count ?? 30) ||
                        (seriesEndDate || null) !== (editingSeries.end_date ?? null),
                });
            } else {
                await updateRealTask(editingTask.id, updates, {
                    detachFromSeries: !!editingTask.series_id && !editingTask.series_exception,
                });
            }
            closeEditDialog();
        }
    }

    async function createTask(taskData: { title: string; description?: string; assignee?: string; dueDate?: string; priority: "low" | "medium" | "high"; }, columnId?: string) {
        const targetColumnId = columnId || createTaskColumnId || columns[0]?.id;
        const targetColumn = columns.find((col) => col.id === targetColumnId) || columns[0];
        if (!targetColumn) throw new Error("No column available to add task");

        if (isRepetitiveBoard && isSeriesEnabled) {
            if (seriesWeekdays.length === 0) throw new Error("Select at least one weekday for the series.");
            if (seriesEndType === "until" && !seriesEndDate) throw new Error("Select an end date for the series.");
            const startDate = seriesStartDate || taskData.dueDate || new Date().toISOString().slice(0, 10);
            await createTaskSeries({
                columnId: targetColumn.id,
                title: taskData.title,
                description: taskData.description || null,
                assignee: taskData.assignee || null,
                priority: taskData.priority,
                weekdays: seriesWeekdays,
                startDate,
                endType: seriesEndType,
                occurrenceCount: seriesOccurrenceCount,
                endDate: seriesEndDate || null,
            });
            return;
        }

        await createRealTask(targetColumn.id, taskData);
    }

    async function handleCreateTask(e: any) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const taskData = {
            title: formData.get("title") as string,
            description: (formData.get("description") as string) || undefined,
            assignee: (formData.get("assignee") as string) || undefined,
            dueDate: (formData.get("dueDate") as string) || undefined,
            priority: (formData.get("priority") as "low" | "medium" | "high") || "medium",
        };

        if (taskData.title.trim()) {
            await createTask(taskData, createTaskColumnId || undefined);
            setIsCreateTaskOpen(false);
            setCreateTaskColumnId(null);
            resetSeriesFields();
        }
    }

    function handleDragStart(event: DragStartEvent) {
        const taskId = event.active.id as string;
        const task = columns.flatMap((col) => col.tasks).find((task) => task.id === taskId);
        if (task) setActiveTask(task);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const sourceColumn = columns.find((col) => col.tasks.some((task) => task.id === activeId));
        const targetColumn = columns.find((col) => col.tasks.some((task) => task.id === overId));

        if (!sourceColumn || !targetColumn) return;

        if (sourceColumn.id === targetColumn.id) {
            const activeIndex = sourceColumn.tasks.findIndex((task) => task.id === activeId);
            const overIndex = targetColumn.tasks.findIndex((task) => task.id === overId);

            if (activeIndex !== overIndex) {
                setColumns((prev: ColumnWithTasks[]) => {
                    const newColumns = [...prev];
                    const column = newColumns.find((col) => col.id === sourceColumn.id);
                    if (column) {
                        const tasks = [...column.tasks];
                        const [removed] = tasks.splice(activeIndex, 1);
                        tasks.splice(overIndex, 0, removed);
                        column.tasks = tasks;
                    }
                    return newColumns;
                });
            }
        }
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id as string;
        const overId = over.id as string;

        const targetColumn = columns.find((col) => col.id === overId);
        if (targetColumn) {
            const sourceColumn = columns.find((col) => col.tasks.some((task) => task.id === taskId));

            if (sourceColumn && sourceColumn.id !== targetColumn.id) {
                await moveTask(taskId, targetColumn.id, targetColumn.tasks.length);
            }
        } else {
            // Check to see if were dropping on another task
            const sourceColumn = columns.find((col) => col.tasks.some((task) => task.id === taskId));
            const targetColumn = columns.find((col) => col.tasks.some((task) => task.id === overId));

            if (sourceColumn && targetColumn) {
                const oldIndex = sourceColumn.tasks.findIndex((task) => task.id === taskId);
                const newIndex = targetColumn.tasks.findIndex((task) => task.id === overId);
                if (oldIndex !== newIndex) {
                    await moveTask(taskId, targetColumn.id, newIndex);
                }
            }
        }
    }

    async function handleCreateColumn(e: React.FormEvent) {
        e.preventDefault();
        if (!newColumnTitle.trim()) return;
        await createColumn(newColumnTitle.trim());
        setNewColumnTitle("");
        setIsCreatingColumn(false);
    }

    async function handleUpdateColumn(e: React.FormEvent) {
        e.preventDefault();
        if (!editingColumnTitle.trim() || !editingColumn) return;
        await updateColumn(editingColumn.id, editingColumnTitle.trim());
        setEditingColumnTitle("");
        setIsEditingColumn(false);
        setEditingColumn(null);
    }

    function handleEditColumn(column: ColumnWithTasks) { setIsEditingColumn(true); setEditingColumn(column); setEditingColumnTitle(column.title); }

    const filteredColumns = columns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => {
            // Filter by priority
            if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
                return false;
            }
            // Filter by due date
            if (filters.dueDate && task.due_date) {
                const taskDate = new Date(task.due_date).toDateString();
                const filterDate = new Date(filters.dueDate).toDateString();
                if (taskDate !== filterDate) return false;
            }
            return true;
        }),
    }));

    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <Navbar boardTitle={board?.title} onEditBoard={() => { setNewTitle(board?.title ?? ""); setNewDescription(board?.description ?? ""); setNewColor(board?.color ?? ""); setIsEditingTitle(true); }}
                    onFilterClick={() => setIsFilterOpen(true)} filterCount={Object.values(filters).reduce((count, v) => count + (Array.isArray(v) ? v.length : v !== null ? 1 : 0), 0)} />
                <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
                    <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                        <DialogHeader>
                            <DialogTitle>Edit board</DialogTitle>
                        </DialogHeader>
                        <form className="space-y-4" onSubmit={handleUpdateBoard}>
                            <div className="space-y-2">
                                <Label htmlFor="boardTitle">Board Title</Label>
                                <Input id="boardTitle" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Enter board title..." required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="boardDescription">Board Description</Label>
                                <Textarea id="boardDescription" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Enter a short description..." rows={2} />
                            </div>
                            <div className="space-y-2">
                                <Label>Board Color</Label>
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                    {BOARD_COLOR_PALETTE.map((color, key) => (
                                        <button key={key} type="button" className={`w-8 h-8 rounded-full ${color} ${color === newColor ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                                            onClick={() => setNewColor(color)} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="outline" onClick={() => setIsEditingTitle(false)}>Cancel</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                        <DialogHeader>
                            <DialogTitle>Filter Tasks</DialogTitle>
                            <p className="text-sm text-gray-600">
                                Filter tasks by priority, assignee, or due date
                            </p>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <div className="flex flex-wrap gap-2">
                                    {["low", "medium", "high"].map((priority, key) => (
                                        <Button onClick={() => {
                                            const newPriorities = filters.priority.includes(priority) ? filters.priority.filter((p) => p !== priority) :
                                                [...filters.priority, priority]; handleFilterChange("priority", newPriorities);
                                        }} key={key} variant={filters.priority.includes(priority) ? "default" : "outline"} size="sm">
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={filters.dueDate || ""} onChange={(e) => handleFilterChange("dueDate", e.target.value || null)} />
                            </div>
                            <div className="flex justify-between pt-4">
                                <Button type="button" variant={"outline"} onClick={clearFilters}>Clear Filters</Button>
                                <Button type="button" onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                {/* Board Content */}
                <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
                    {/* Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Total Tasks: </span>
                                {columns.reduce((sum, col) => sum + col.tasks.length, 0)}
                            </div>
                        </div>
                        {/* Add task dialog */}
                        <Dialog open={isCreateTaskOpen && createTaskColumnId === null} onOpenChange={(open) => { setIsCreateTaskOpen(open); if (open) resetSeriesFields(); if (!open) setCreateTaskColumnId(null); }}>
                            <DialogTrigger render={<Button className="w-full sm:w-auto" onClick={() => { setCreateTaskColumnId(null); setIsCreateTaskOpen(true); resetSeriesFields(); }} />}>
                                <Plus /> Add Task
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                                <DialogHeader>
                                    <DialogTitle>Create New Task</DialogTitle>
                                    <p className="text-sm text-gray-600">Add a task to the board</p>
                                </DialogHeader>
                                <form className="space-y-4" onSubmit={handleCreateTask}>
                                    <div className="space-y-2">
                                        <Label>Title *</Label>
                                        <Input id="title" name="title" placeholder="Enter task title" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea id="description" name="description" placeholder="Enter task description" rows={3} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Assignee</Label>
                                        <Input id="assignee" name="assignee" placeholder="Who should do this?" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Priority</Label>
                                        <Select name="priority" defaultValue="medium">
                                            <SelectTrigger>
                                                <SelectValue>
                                                    {(value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : undefined}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {["low", "medium", "high"].map((priority, key) => (
                                                    <SelectItem key={key} value={priority}>
                                                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{isRepetitiveBoard && isSeriesEnabled ? "Start Date" : "Due Date"}</Label>
                                        {isRepetitiveBoard ? (
                                            <Input
                                                type="date"
                                                id="dueDate"
                                                name="dueDate"
                                                value={seriesStartDate}
                                                onChange={(e) => setSeriesStartDate(e.target.value)}
                                            />
                                        ) : (
                                            <Input type="date" id="dueDate" name="dueDate" />
                                        )}
                                    </div>
                                    {renderSeriesSchedulerFields()}
                                    <div className="flex justify-end space-x-2 pt-4">
                                        <Button type="submit">{createTaskSubmitLabel}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {/* Board Columns */}
                    <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                        <div className="flex flex-col lg:flex-row lg:space-x-6 lg:overflow-x-auto lg:pb-6 lg:px-2 lg:-mx-2 lg:[&::-webkit-scrollbar]:h-2 lg:[&::-webkit-scrollbar-track]:bg-gray-100 
                        lg:[&::-webkit-scrollbar-thumb]:bg-gray-300 lg:[&::-webkit-scrollbar-thumb]:rounded-full space-y-4 lg:space-y-0">
                            {filteredColumns.map((column, key) => (
                                <DroppableColumn key={key} column={column} onCreateTask={handleCreateTask} onEditColumn={handleEditColumn}
                                    isCreateTaskOpen={isCreateTaskOpen && createTaskColumnId === column.id}
                                    onCreateTaskOpenChange={(open) => { setIsCreateTaskOpen(open); if (open) { setCreateTaskColumnId(column.id); resetSeriesFields(); } else setCreateTaskColumnId(null); }}
                                    seriesFields={renderSeriesSchedulerFields()}
                                    submitLabel={createTaskSubmitLabel}>
                                    <SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-3">
                                            {column.tasks.map((task, key) => (<SortableTask task={task} key={key} onEditTask={openEditDialog} />))}
                                        </div>
                                    </SortableContext>
                                </DroppableColumn>
                            ))}
                            <div className="w-full lg:flex-shrink-0 lg:w-80">
                                <Button variant="outline" className="w-full h-full min-h-[200px] border-dashed border-2 text-gray-500 hover:text-gray-700" onClick={() => setIsCreatingColumn(true)}>
                                    <Plus />
                                    Add another list
                                </Button>
                            </div>
                            <DragOverlay>
                                {activeTask ? <TaskOverlay task={activeTask} /> : null}
                            </DragOverlay>
                        </div>
                    </DndContext>
                </main>
            </div>

            <Dialog open={isCreatingColumn} onOpenChange={setIsCreatingColumn}>
                <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Column</DialogTitle>
                        <p className="text-sm text-gray-600">
                            Add new column to organize your tasks
                        </p>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreateColumn}>
                        <div className="space-y-2">
                            <Label>Column Title</Label>
                            <Input id="columnTitle" value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} placeholder="Enter column title..." required />
                        </div>
                        <div className="space-x-2 flex justify-end">
                            <Button type="button" onClick={() => setIsCreatingColumn(false)} variant="outline">Cancel</Button>
                            <Button type="submit">Create Column</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditingColumn} onOpenChange={setIsEditingColumn}>
                <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Column</DialogTitle>
                        <p className="text-sm text-gray-600">
                            Update the title of your column
                        </p>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleUpdateColumn}>
                        <div className="space-y-2">
                            <Label>Column Title</Label>
                            <Input id="columnTitle" value={editingColumnTitle} onChange={(e) => setEditingColumnTitle(e.target.value)} placeholder="Enter column title..." required
                            />
                        </div>
                        <div className="space-x-2 flex justify-end">
                            <Button type="button" onClick={() => { setIsEditingColumn(false); setEditingColumnTitle(""); setEditingColumn(null); }} variant="outline" >Cancel</Button>
                            <Button type="submit">Edit Column</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editingTask !== null} onOpenChange={(open) => { if (!open) closeEditDialog(); }}>
                <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                    {editingTask && editScope === "choose" && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Edit Recurring Task</DialogTitle>
                                <p className="text-sm text-gray-600">This task belongs to a series. What would you like to edit?</p>
                            </DialogHeader>
                            <div className="space-y-3 pt-2">
                                <Button className="w-full justify-start" onClick={() => setEditScope("individual")}>
                                    This task only
                                </Button>
                                <Button className="w-full justify-start" variant="outline" onClick={() => startSeriesEdit(editingTask)}>
                                    Entire series
                                </Button>
                                <div className="flex justify-end pt-2">
                                    <Button type="button" variant="outline" onClick={closeEditDialog}>Cancel</Button>
                                </div>
                            </div>
                        </>
                    )}
                    {editingTask && editScope !== "choose" && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{editScope === "series" ? "Edit Series" : "Edit Task"}</DialogTitle>
                                <p className="text-sm text-gray-600">
                                    {editScope === "series" ? "Update the recurring schedule and task details" : "Update task details"}
                                </p>
                            </DialogHeader>
                            <form className="space-y-4" onSubmit={handleUpdateTaskSubmit} key={`${editingTask.id}-${editScope}`}>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-title">Title *</Label>
                                    <Input
                                        id="edit-title"
                                        name="title"
                                        defaultValue={editScope === "series" && editingSeries ? editingSeries.title : editingTask.title}
                                        placeholder="Enter task title"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                        id="edit-description"
                                        name="description"
                                        defaultValue={editScope === "series" && editingSeries ? editingSeries.description || "" : editingTask.description || ""}
                                        placeholder="Enter task description"
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-assignee">Assignee</Label>
                                    <Input
                                        id="edit-assignee"
                                        name="assignee"
                                        defaultValue={editScope === "series" && editingSeries ? editingSeries.assignee || "" : editingTask.assignee || ""}
                                        placeholder="Who should do this?"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select
                                        name="priority"
                                        defaultValue={editScope === "series" && editingSeries ? editingSeries.priority : editingTask.priority}
                                    >
                                        <SelectTrigger>
                                            <SelectValue>
                                                {(value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : undefined}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["low", "medium", "high"].map((priority, key) => (
                                                <SelectItem key={key} value={priority}>
                                                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {editScope === "individual" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-dueDate">Due Date</Label>
                                        <Input type="date" id="edit-dueDate" name="dueDate" defaultValue={editingTask.due_date || ""} />
                                    </div>
                                )}
                                {editScope === "series" && (
                                    <SeriesSchedulerFields
                                        enabled
                                        showToggle={false}
                                        weekdays={seriesWeekdays}
                                        onWeekdaysChange={setSeriesWeekdays}
                                        endType={seriesEndType}
                                        onEndTypeChange={setSeriesEndType}
                                        occurrenceCount={seriesOccurrenceCount}
                                        onOccurrenceCountChange={setSeriesOccurrenceCount}
                                        endDate={seriesEndDate}
                                        onEndDateChange={setSeriesEndDate}
                                    />
                                )}
                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button type="button" variant="outline" onClick={closeEditDialog}>Cancel</Button>
                                    <Button type="submit">{editScope === "series" ? "Update Series" : "Update Task"}</Button>
                                </div>
                            </form>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}