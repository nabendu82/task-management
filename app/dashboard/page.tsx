"use client"

import Navbar from "@/components/navbar";
import { useUser } from "@clerk/nextjs";
import { useBoards } from "@/lib/hooks/useBoards";
import { useCalendar } from "@/lib/hooks/useCalendar";
import { Plus, Loader2, Grid3x3, List, Filter, Trello, Search, ArrowRight, ClipboardList, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Board } from "@/lib/supabase/models";
import { getBoardColorStyles, getNextBoardColor } from "@/lib/utils";

export default function DashboardPage() {
    const { user } = useUser();
    const { createBoard, boards, loading: boardsLoading, error: boardsError } = useBoards();
    const { tasks, loading: calendarLoading, error: calendarError } = useCalendar();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

    const [filters, setFilters] = useState({
        search: "",
        dateRange: { start: null as string | null, end: null as string | null },
        taskCount: { min: null as number | null, max: null as number | null }
    });

    const filterCount = (filters.search ? 1 : 0) +
        (filters.dateRange.start ? 1 : 0) +
        (filters.dateRange.end ? 1 : 0) +
        (filters.taskCount.min !== null ? 1 : 0) +
        (filters.taskCount.max !== null ? 1 : 0);

    const boardsWithTaskCount = boards.map((board: Board) => ({ ...board, taskCount: 0 }));

    const filteredBoards = boardsWithTaskCount.filter((board: Board) => {
        const matchesSearch = board.title.toLowerCase().includes(filters.search.toLowerCase());

        const matchesDateRange = (!filters.dateRange.start || new Date(board.created_at) >= new Date(filters.dateRange.start)) &&
            (!filters.dateRange.end || new Date(board.created_at) <= new Date(filters.dateRange.end));

        return matchesSearch && matchesDateRange;
    });

    function clearFilters() {
        setFilters({
            search: "",
            dateRange: { start: null as string | null, end: null as string | null },
            taskCount: { min: null as number | null, max: null as number | null }
        });
    }

    const loading = boardsLoading || calendarLoading;
    const error = boardsError || calendarError;

    const handleCreateBoard = () => {
        createBoard({ title: "New Board", description: "A new board", color: getNextBoardColor(boards.length) })
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <h2 className="text-red-500"> Error loading dashboard</h2>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-6 sm:py-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Welcome back,{" "}
                        {user?.firstName ?? user?.emailAddresses[0].emailAddress}! 👋
                    </h1>
                    <p className="text-gray-600">
                        Here's what's happening with your boards today.
                    </p>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <Card className="border border-blue-100 bg-blue-50/40 shadow-xs">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-blue-900/80">Total Boards</p>
                                    <p className="text-xl sm:text-2xl font-bold text-blue-950">{boards.length}</p>
                                </div>
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100/80 rounded-lg flex items-center justify-center">
                                    <Trello className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-amber-100 bg-amber-50/40 shadow-xs">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-amber-900/80">Total Tasks</p>
                                    <p className="text-xl sm:text-2xl font-bold text-amber-950">{tasks.length}</p>
                                </div>
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100/80 rounded-lg flex items-center justify-center">
                                    <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-emerald-100 bg-emerald-50/40 shadow-xs">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-emerald-900/80">Completed Tasks</p>
                                    <p className="text-xl sm:text-2xl font-bold text-emerald-950">
                                        {tasks.filter(t => t.is_completed).length}
                                    </p>
                                </div>
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-100/80 rounded-lg flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {/* Boards */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Your Boards
                            </h2>
                            <p className="text-gray-600">Manage your projects and tasks</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2 rounded bg-white border p-1">
                                <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
                                    <Grid3x3 />
                                </Button>
                                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
                                    <List />
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" className={`text-xs sm:text-sm ${filterCount > 0 ? "bg-blue-100 border-blue-200" : ""}`} onClick={() => setIsFilterOpen(true)}>
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                                {filterCount > 0 && (
                                    <Badge variant="secondary" className="text-xs ml-2 bg-blue-100 border-blue-200">
                                        {filterCount}
                                    </Badge>
                                )}
                            </Button>
                            <Button onClick={handleCreateBoard}>
                                <Plus />
                                Create Board
                            </Button>
                        </div>
                    </div>
                    {/* Search Bar */}
                    <div className="relative mb-4 sm:mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input id="search" placeholder="Search boards..." className="pl-10" value={filters.search} onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))} />
                    </div>
                    {/* Boards Grid/List */}
                    {boards.length === 0 ? (
                        <div>No boards yet</div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {filteredBoards.map((board) => {
                                const styles = getBoardColorStyles(board.color);
                                return (
                                    <Link key={board.id} href={`/boards/${board.id}`} className="block h-full">
                                        <Card className={`hover:shadow-lg transition-all cursor-pointer group h-full flex flex-col border ${styles.bg} ${styles.border}`}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center justify-between">
                                                    <div className={`w-4 h-4 ${board.color} rounded-full`} />
                                                    <Badge className={`text-xs ${styles.badge}`} variant="secondary">New</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 sm:p-6 flex flex-col flex-grow">
                                                <CardTitle className={`text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors ${styles.text} font-bold`}>{board.title}</CardTitle>
                                                <CardDescription className={`text-sm mb-4 flex-grow ${styles.text} opacity-80`}>{board.description}</CardDescription>
                                                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs space-y-1 sm:space-y-0 mt-auto ${styles.text} opacity-60`}>
                                                    <span>Created{" "}{new Date(board.created_at).toLocaleDateString()}</span>
                                                    <span>Updated{" "}{new Date(board.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div>
                            {boards.map((board, key) => {
                                const styles = getBoardColorStyles(board.color);
                                return (
                                    <div key={key} className={key > 0 ? "mt-4" : ""}>
                                        <Link href={`/boards/${board.id}`}>
                                            <Card className={`hover:shadow-lg transition-all cursor-pointer group border ${styles.bg} ${styles.border}`}>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className={`w-4 h-4 ${board.color} rounded-full`} />
                                                        <Badge className={`text-xs ${styles.badge}`} variant="secondary">New</Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 sm:p-6">
                                                    <CardTitle className={`text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors ${styles.text} font-bold`}>{board.title}</CardTitle>
                                                    <CardDescription className={`text-sm mb-4 ${styles.text} opacity-80`}>{board.description}</CardDescription>
                                                    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs space-y-1 sm:space-y-0 ${styles.text} opacity-60`}>
                                                        <span>Created{" "}{new Date(board.created_at).toLocaleDateString()}</span>
                                                        <span>Updated{" "}{new Date(board.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Calendar Section */}
                <div className="mt-12 mb-8 border-t pt-8">
                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Calendar</h2>
                        <p className="text-gray-600">Track and schedule tasks across days, weeks, or months.</p>
                    </div>
                    <Link href="/calendar">
                        <Card className="hover:shadow-lg transition-all cursor-pointer group border border-purple-200 bg-purple-50 hover:bg-purple-100/60 overflow-hidden relative">
                            <CardContent className="p-8 sm:p-12 flex flex-col sm:flex-row items-center sm:justify-between space-y-6 sm:space-y-0">
                                <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
                                    <div className="h-16 w-16 bg-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center transition-colors shadow-inner">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Open Personal Calendar</h3>
                                        <p className="text-sm text-gray-600 mt-1 max-w-md">
                                            View all your tasks scheduled by due date. Drag and drop to reschedule instantly, toggle task completions, and review your history.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center text-purple-600 font-medium group-hover:translate-x-2 transition-transform">
                                    <span>Go to Calendar</span>
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </main>
            {/* Filter Dialog */}
            <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <DialogContent className="w-[95vw] max-w-[425px] mx-auto">
                    <DialogHeader>
                        <DialogTitle>Filter Boards</DialogTitle>
                        <p className="text-sm text-gray-600">Filter boards by title, date, or task count.</p>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Search</Label>
                            <Input id="search" placeholder="Search board titles..." value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Start Date</Label>
                                    <Input type="date" value={filters.dateRange.start || ""} onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value || null, }, }))} />
                                </div>
                                <div>
                                    <Label className="text-xs">End Date</Label>
                                    <Input type="date" value={filters.dateRange.end || ""} onChange={(e) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value || null, }, }))} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Task Count</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-xs">Minimum</Label>
                                    <Input type="number" min="0" placeholder="Min tasks" value={filters.taskCount.min !== null ? filters.taskCount.min : ""} onChange={e => setFilters(prev => ({ ...prev, taskCount: { ...prev.taskCount, min: e.target.value ? Number(e.target.value) : null, }, }))} />
                                </div>
                                <div>
                                    <Label className="text-xs">Maximum</Label>
                                    <Input type="number" min="0" placeholder="Max tasks" value={filters.taskCount.max !== null ? filters.taskCount.max : ""} onChange={e => setFilters(prev => ({ ...prev, taskCount: { ...prev.taskCount, max: e.target.value ? Number(e.target.value) : null, }, }))} />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between pt-4 space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                            <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}   