"use client";

import Navbar from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCalendar } from "@/lib/hooks/useCalendar";
import { Task, Column } from "@/lib/supabase/models";
import { getBoardColorStyles } from "@/lib/utils";
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    User, 
    CheckSquare, 
    Square, 
    Layers,
    ListTodo,
    Loader2,
    Eye,
    EyeOff
} from "lucide-react";
import { useState, useEffect } from "react";

type ViewMode = "day" | "week" | "month";

export default function CalendarPage() {
    const {
        tasks,
        boards,
        loading,
        error,
        updateTaskDueDate,
        toggleTaskCompletion,
        createTaskOnCalendar,
        getColumnsForBoard
    } = useCalendar();

    // Calendar navigation states
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [showCompleted, setShowCompleted] = useState<boolean>(true);
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);

    // Task Creation Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createTargetDate, setCreateTargetDate] = useState<string>("");
    const [formBoardId, setFormBoardId] = useState<string>("");
    const [formColumnId, setFormColumnId] = useState<string>("");
    const [boardColumns, setBoardColumns] = useState<Column[]>([]);
    const [columnsLoading, setColumnsLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);
    
    // Form Inputs
    const [formTitle, setFormTitle] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formAssignee, setFormAssignee] = useState("");
    const [formPriority, setFormPriority] = useState<"low" | "medium" | "high">("medium");

    // Load columns when target board changes
    useEffect(() => {
        if (formBoardId) {
            loadColumns(formBoardId);
        } else {
            setBoardColumns([]);
            setFormColumnId("");
        }
    }, [formBoardId]);

    // Pre-populate board selection when opening dialog
    useEffect(() => {
        if (isCreateOpen && boards.length > 0 && !formBoardId) {
            setFormBoardId(boards[0].id.toString());
        }
    }, [isCreateOpen, boards]);

    async function loadColumns(boardId: string) {
        setColumnsLoading(true);
        try {
            const cols = await getColumnsForBoard(boardId);
            setBoardColumns(cols);
            if (cols.length > 0) {
                setFormColumnId(cols[0].id.toString());
            } else {
                setFormColumnId("");
            }
        } catch (err) {
            console.error("Failed to load columns:", err);
        } finally {
            setColumnsLoading(false);
        }
    }

    // Helper functions for calendar calculations
    function formatDateKey(date: Date): string {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function getMonthDays(date: Date): Date[] {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const prevMonthTotalDays = new Date(year, month, 0).getDate();
        
        const days: Date[] = [];
        
        // Pad from previous month
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            days.push(new Date(year, month - 1, prevMonthTotalDays - i));
        }
        
        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(year, month, i));
        }
        
        // Pad from next month (fill up to 42 cells for standard grid)
        const totalCells = days.length > 35 ? 42 : 35;
        const remainingCells = totalCells - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push(new Date(year, month + 1, i));
        }
        
        return days;
    }

    function getWeekDays(referenceDate: Date): Date[] {
        const date = new Date(referenceDate);
        const day = date.getDay();
        const diff = date.getDate() - day; // Adjust to Sunday
        const sunday = new Date(date.setDate(diff));
        
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(sunday);
            nextDay.setDate(sunday.getDate() + i);
            days.push(nextDay);
        }
        return days;
    }

    // Navigation triggers
    const navigateCalendar = (direction: "prev" | "next") => {
        const amount = direction === "prev" ? -1 : 1;
        const newDate = new Date(currentDate);

        if (viewMode === "month") {
            newDate.setMonth(currentDate.getMonth() + amount);
        } else if (viewMode === "week") {
            newDate.setDate(currentDate.getDate() + amount * 7);
        } else {
            newDate.setDate(currentDate.getDate() + amount);
        }
        setCurrentDate(newDate);
    };

    const navigateToToday = () => {
        setCurrentDate(new Date());
    };

    // Header date string formatter
    const getHeaderDateString = () => {
        if (viewMode === "month") {
            return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        } else if (viewMode === "week") {
            const weekDays = getWeekDays(currentDate);
            const first = weekDays[0];
            const last = weekDays[6];
            if (first.getFullYear() !== last.getFullYear()) {
                return `${first.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
            }
            if (first.getMonth() !== last.getMonth()) {
                return `${first.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
            }
            return `${first.toLocaleDateString("en-US", { month: "long" })} ${first.getDate()}–${last.getDate()}, ${first.getFullYear()}`;
        } else {
            return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        }
    };

    // Native HTML5 Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData("text/plain", taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, dateStr: string) => {
        e.preventDefault();
        if (dragOverDate !== dateStr) {
            setDragOverDate(dateStr);
        }
    };

    const handleDragLeave = () => {
        setDragOverDate(null);
    };

    const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
        e.preventDefault();
        setDragOverDate(null);
        const taskId = e.dataTransfer.getData("text/plain");
        if (!taskId) return;

        // Optimistically update date in state
        try {
            await updateTaskDueDate(taskId, targetDateStr);
        } catch (err) {
            console.error("Drop failed:", err);
        }
    };

    // Dialog creation trigger
    const openCreateDialog = (dateStr: string) => {
        setCreateTargetDate(dateStr);
        setFormTitle("");
        setFormDescription("");
        setFormAssignee("");
        setFormPriority("medium");
        setFormError(null);
        setFormSubmitting(false);
        setIsCreateOpen(true);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim()) return;
        if (!formColumnId) return;

        setFormSubmitting(true);
        setFormError(null);
        try {
            await createTaskOnCalendar({
                title: formTitle,
                description: formDescription,
                assignee: formAssignee,
                dueDate: createTargetDate,
                priority: formPriority,
                columnId: formColumnId
            });
            setIsCreateOpen(false);
        } catch (err: any) {
            console.error("Task creation failed:", err);
            const errMsg = err instanceof Error 
                ? err.message 
                : (err && typeof err === "object" && "message" in err)
                    ? String(err.message)
                    : "Failed to create task.";
            setFormError(errMsg);
        } finally {
            setFormSubmitting(false);
        }
    };

    // Task Card priority color helper
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

    // Render single task item inside calendar slot
    const renderTaskItem = (task: Task) => {
        const isFinished = task.is_completed ?? false;
        const boardId = (task as any).columns?.board_id;
        const board = boards.find(b => b.id.toString() === boardId?.toString());
        const styles = getBoardColorStyles(board?.color);

        return (
            <div
                key={task.id}
                draggable={!isFinished}
                onDragStart={(e) => handleDragStart(e, task.id)}
                className={`flex items-start space-x-2 p-2 rounded-lg border shadow-xs transition-all ${
                    isFinished 
                        ? `opacity-70 ${styles.bg} ${styles.border}` 
                        : `hover:shadow-md hover:border-blue-400 cursor-grab active:cursor-grabbing ${styles.bg} ${styles.border}`
                }`}
            >
                <button
                    onClick={async () => {
                        try {
                            await toggleTaskCompletion(task.id, !(task.is_completed ?? false));
                        } catch (err) {
                            console.error("Failed to toggle task completion status:", err);
                        }
                    }}
                    className={`mt-0.5 transition-colors flex-shrink-0 ${isFinished ? styles.accent : "text-gray-400 hover:text-blue-600"}`}
                >
                    {isFinished ? (
                        <CheckSquare className="h-4 w-4" />
                    ) : (
                        <Square className="h-4 w-4" />
                    )}
                </button>
                <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate leading-tight ${styles.text} ${isFinished ? "line-through opacity-60" : ""}`}>
                        {task.title}
                    </p>
                    {task.description && (
                        <p className={`text-[10px] truncate mt-0.5 leading-snug ${styles.text} opacity-80 ${isFinished ? "line-through opacity-40" : ""}`}>
                            {task.description}
                        </p>
                    )}
                    {task.assignee && (
                        <div className={`flex items-center space-x-1 mt-0.5 text-[10px] ${styles.text} opacity-70`}>
                            <User className="h-2.5 w-2.5" />
                            <span className="truncate">{task.assignee}</span>
                        </div>
                    )}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${getPriorityColor(task.priority)}`} />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading calendar...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md text-center">
                        <h2 className="text-red-700 font-bold text-lg mb-2">Error Loading Calendar</h2>
                        <p className="text-red-600 text-sm mb-4">{error}</p>
                        <Button onClick={() => window.location.reload()}>Try Again</Button>
                    </div>
                </div>
            </div>
        );
    }

    // Filter tasks based on view options and dates
    const getTasksForDate = (dateStr: string) => {
        return tasks.filter((t) => {
            const isMatch = t.due_date === dateStr;
            const isCompletedMatch = showCompleted || !(t.is_completed ?? false);
            return isMatch && isCompletedMatch;
        });
    };

    // Render Calendars grids based on active mode
    const renderMonthView = () => {
        const days = getMonthDays(currentDate);
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayStr = formatDateKey(new Date());

        return (
            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col bg-white rounded-2xl border shadow-xs overflow-hidden">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 border-b bg-slate-50/50 text-center font-semibold text-xs text-gray-500 uppercase tracking-wider py-3">
                        {weekdays.map((day) => (
                            <div key={day}>{day}</div>
                        ))}
                    </div>

                    {/* Day Cells Grid */}
                    <div className="grid grid-cols-7 flex-grow divide-x divide-y divide-slate-100 bg-slate-50/20">
                        {days.map((day, idx) => {
                            const dateStr = formatDateKey(day);
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                            const isToday = dateStr === todayStr;
                            const isSelected = formatDateKey(day) === formatDateKey(currentDate);
                            const dateTasks = getTasksForDate(dateStr);
                            const isOver = dragOverDate === dateStr;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => setCurrentDate(day)}
                                    onDragOver={(e) => handleDragOver(e, dateStr)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, dateStr)}
                                    className={`min-h-[60px] sm:min-h-[120px] p-1 sm:p-2 flex flex-col space-y-1 transition-all cursor-pointer ${
                                        isCurrentMonth ? "bg-white" : "bg-gray-50/50 text-gray-400"
                                    } ${isToday ? "bg-blue-50/20" : ""} ${
                                        isSelected ? "ring-2 ring-blue-600 ring-inset bg-blue-50/30" : ""
                                    } ${
                                        isOver ? "ring-2 ring-blue-500 ring-inset bg-blue-50/40" : ""
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                                        <span 
                                            className={`text-[10px] sm:text-xs font-bold h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center ${
                                                isToday 
                                                    ? "bg-blue-600 text-white shadow-xs" 
                                                    : isCurrentMonth ? "text-gray-700" : "text-gray-400"
                                            }`}
                                        >
                                            {day.getDate()}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openCreateDialog(dateStr);
                                            }}
                                            className="h-5 w-5 rounded-md hover:bg-slate-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors hidden sm:flex"
                                            title="Add task to this date"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    
                                    {/* Desktop view: full task items */}
                                    <div className="hidden sm:block flex-1 overflow-y-auto space-y-1.5 max-h-[80px] sm:max-h-[100px] scrollbar-thin">
                                        {dateTasks.map(renderTaskItem)}
                                    </div>

                                    {/* Mobile view: task dots */}
                                    <div className="flex sm:hidden flex-wrap justify-center gap-0.5 mt-0.5 max-w-full">
                                        {dateTasks.slice(0, 3).map((task) => {
                                            const boardId = (task as any).columns?.board_id;
                                            const board = boards.find(b => b.id.toString() === boardId?.toString());
                                            const colorClass = board?.color || "bg-blue-500";
                                            return (
                                                <span key={task.id} className={`w-1.5 h-1.5 rounded-full ${colorClass}`} />
                                            );
                                        })}
                                        {dateTasks.length > 3 && (
                                            <span className="text-[8px] leading-none font-bold text-gray-500">+</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile Tasks List for the Selected Day */}
                <div className="block sm:hidden mt-4 bg-white rounded-2xl border shadow-xs p-4">
                    <div className="flex items-center justify-between border-b pb-2 mb-3">
                        <h3 className="font-bold text-gray-800 text-sm">
                            Tasks for {currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </h3>
                        <Button 
                            onClick={() => openCreateDialog(formatDateKey(currentDate))} 
                            size="sm" 
                            className="h-7 text-xs px-2.5"
                        >
                            <Plus className="mr-1 h-3 w-3" /> Add Task
                        </Button>
                    </div>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto">
                        {getTasksForDate(formatDateKey(currentDate)).length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No tasks scheduled for this day.</p>
                        ) : (
                            getTasksForDate(formatDateKey(currentDate)).map(renderTaskItem)
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const days = getWeekDays(currentDate);
        const todayStr = formatDateKey(new Date());

        return (
            <div className="flex-1 flex flex-col md:flex-row bg-slate-50 md:bg-white rounded-2xl border md:border shadow-xs overflow-hidden md:divide-x divide-slate-100 space-y-3 md:space-y-0 p-3 md:p-0">
                {days.map((day, idx) => {
                    const dateStr = formatDateKey(day);
                    const isToday = dateStr === todayStr;
                    const dateTasks = getTasksForDate(dateStr);
                    const isOver = dragOverDate === dateStr;

                    return (
                        <div
                            key={idx}
                            onDragOver={(e) => handleDragOver(e, dateStr)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, dateStr)}
                            className={`flex-1 flex flex-col p-4 space-y-3 min-h-0 md:min-h-[450px] transition-all rounded-xl md:rounded-none border md:border-0 bg-white ${
                                isToday ? "bg-blue-50/15 border-blue-200" : "border-slate-100"
                            } ${isOver ? "ring-2 ring-blue-500 ring-inset bg-blue-50/40" : ""}`}
                        >
                            <div className="flex items-center justify-between border-b pb-2">
                                <div className="flex md:flex-col items-center md:items-start space-x-2 md:space-x-0">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                                    </p>
                                    <p className={`text-sm md:text-xl font-bold md:mt-0.5 h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center ${
                                        isToday ? "bg-blue-600 text-white shadow-xs" : "text-gray-800"
                                    }`}>
                                        {day.getDate()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => openCreateDialog(dateStr)}
                                    className="h-6 w-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                                    title="Add task to this date"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 space-y-2">
                                {dateTasks.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-2 md:hidden">No tasks</p>
                                ) : (
                                    dateTasks.map(renderTaskItem)
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDayView = () => {
        const dateStr = formatDateKey(currentDate);
        const todayStr = formatDateKey(new Date());
        const isToday = dateStr === todayStr;
        const dateTasks = getTasksForDate(dateStr);
        const isOver = dragOverDate === dateStr;

        return (
            <div className="flex-1 flex justify-center bg-slate-50/30 p-4 sm:p-6">
                <div 
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`w-full max-w-2xl bg-white rounded-2xl border shadow-sm p-6 flex flex-col space-y-4 transition-all min-h-[400px] ${
                        isOver ? "ring-2 ring-blue-500 bg-blue-50/20" : ""
                    }`}
                >
                    <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center space-x-3">
                            <span className={`text-2xl font-bold h-10 w-10 rounded-full flex items-center justify-center ${
                                isToday ? "bg-blue-600 text-white shadow-xs" : "bg-slate-100 text-gray-800"
                            }`}>
                                {currentDate.getDate()}
                            </span>
                            <div>
                                <h3 className="font-bold text-gray-800">
                                    {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
                                </h3>
                                <p className="text-xs text-gray-500">{currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                            </div>
                        </div>
                        <Button onClick={() => openCreateDialog(dateStr)} size="sm">
                            <Plus className="mr-1 h-4 w-4" /> Add Task
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2.5">
                        {dateTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-400">
                                <ListTodo className="h-10 w-10 mb-2 stroke-1" />
                                <p className="text-sm font-medium">No tasks scheduled for today.</p>
                                <p className="text-xs mt-1">Drag tasks here or click Add Task to get started.</p>
                            </div>
                        ) : (
                            dateTasks.map(renderTaskItem)
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex flex-col">
            <Navbar />
            <main className="container mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col">
                
                {/* Control bar */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                    
                    {/* Navigation Controls */}
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="flex items-center space-x-1 rounded-lg bg-white border p-1 shadow-xs">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigateCalendar("prev")}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs px-2.5 h-8 font-semibold text-gray-700" onClick={navigateToToday}>
                                Today
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigateCalendar("next")}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate select-none">
                            {getHeaderDateString()}
                        </h2>
                    </div>

                    {/* View Controls & Filters */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        
                        {/* Completed Filter Toggle */}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={`shadow-xs text-xs font-semibold ${!showCompleted ? "bg-slate-100 border-slate-200" : ""}`}
                            onClick={() => setShowCompleted(!showCompleted)}
                        >
                            {showCompleted ? (
                                <>
                                    <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                                    Hide Completed
                                </>
                            ) : (
                                <>
                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                    Show Completed
                                </>
                            )}
                        </Button>

                        {/* View Switcher */}
                        <div className="flex items-center space-x-1 rounded-lg bg-white border p-1 shadow-xs">
                            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                                <Button
                                    key={mode}
                                    variant={viewMode === mode ? "default" : "ghost"}
                                    size="sm"
                                    className="text-xs capitalize font-semibold h-8"
                                    onClick={() => setViewMode(mode)}
                                >
                                    {mode}
                                </Button>
                            ))}
                        </div>

                        {/* General Create button */}
                        <Button onClick={() => openCreateDialog(formatDateKey(currentDate))} size="sm" className="shadow-xs font-semibold">
                            <Plus className="mr-1.5 h-4 w-4" /> New Task
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                {boards.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border rounded-2xl shadow-xs py-16">
                        <Layers className="h-12 w-12 text-slate-300 stroke-1 mb-4" />
                        <h3 className="font-bold text-gray-800 text-lg mb-1">No Boards Found</h3>
                        <p className="text-gray-500 text-sm max-w-sm mb-6">
                            To schedule tasks on your calendar, you need to create a project board first.
                        </p>
                        <Button onClick={() => window.location.href = "/dashboard"}>Go to Dashboard</Button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                        {viewMode === "month" && renderMonthView()}
                        {viewMode === "week" && renderWeekView()}
                        {viewMode === "day" && renderDayView()}
                    </div>
                )}
            </main>

            {/* Task Creation Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="w-[95vw] max-w-[450px] mx-auto">
                    <DialogHeader>
                        <DialogTitle>Add Task to Calendar</DialogTitle>
                        <p className="text-sm text-gray-500">Create a task for your calendar</p>
                    </DialogHeader>
                    <form className="space-y-4" onSubmit={handleCreateTask}>
                        {formError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
                                {formError}
                            </div>
                        )}
                        
                        {/* Board Selector */}
                        <div className="space-y-1.5">
                            <Label htmlFor="boardId">Board *</Label>
                            <Select value={formBoardId} onValueChange={(val) => setFormBoardId(val || "")} required>
                                <SelectTrigger id="boardId">
                                    <SelectValue placeholder="Select a board">
                                        {(value) => value ? (boards.find((b) => b.id.toString() === value)?.title || value) : undefined}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {boards.map((b) => (
                                        <SelectItem key={b.id} value={b.id.toString()}>
                                            {b.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Column Selector */}
                        <div className="space-y-1.5">
                            <Label htmlFor="columnId">Column *</Label>
                            <Select 
                                value={formColumnId} 
                                onValueChange={(val) => setFormColumnId(val || "")} 
                                required
                                disabled={columnsLoading || boardColumns.length === 0}
                            >
                                <SelectTrigger id="columnId">
                                    <SelectValue placeholder={columnsLoading ? "Loading columns..." : "Select column"}>
                                        {(value) => value ? (boardColumns.find((c) => c.id.toString() === value)?.title || value) : undefined}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {boardColumns.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {boardColumns.length === 0 && !columnsLoading && formBoardId && (
                                <p className="text-xs text-amber-600 mt-1">This board has no columns. Please create a column in the board view first.</p>
                            )}
                        </div>

                        {/* Task Title */}
                        <div className="space-y-1.5">
                            <Label htmlFor="taskTitle">Title *</Label>
                            <Input 
                                id="taskTitle" 
                                placeholder="What needs to be done?" 
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="taskDesc">Description</Label>
                            <Textarea 
                                id="taskDesc" 
                                placeholder="Enter description..." 
                                rows={3}
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                            />
                        </div>

                        {/* Assignee & Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="taskAssignee">Assignee</Label>
                                <Input 
                                    id="taskAssignee" 
                                    placeholder="Assign to..." 
                                    value={formAssignee}
                                    onChange={(e) => setFormAssignee(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="taskPriority">Priority</Label>
                                <Select 
                                    value={formPriority} 
                                    onValueChange={(val: any) => setFormPriority(val)}
                                >
                                    <SelectTrigger id="taskPriority">
                                        <SelectValue>
                                            {(value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : undefined}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="taskDueDate">Due Date</Label>
                            <Input 
                                id="taskDueDate" 
                                type="date" 
                                value={createTargetDate}
                                onChange={(e) => setCreateTargetDate(e.target.value)}
                            />
                        </div>

                        {/* Form Submission */}
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)} disabled={formSubmitting}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={!formTitle.trim() || !formColumnId || formSubmitting}
                            >
                                {formSubmitting ? "Adding..." : "Add Task"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
