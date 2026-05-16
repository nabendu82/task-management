"use client"

import Navbar from "@/components/navbar";
import { useUser } from "@clerk/nextjs";
import { useBoards } from "@/lib/hooks/useBoards";
import { Plus, Loader2, Grid3x3, List, Filter, Trello, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function DashboardPage() {
    const { user } = useUser();
    const { createBoard, boards, loading, error } = useBoards();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const handleCreateBoard = () => {
        createBoard({ title: "New Board", description: "A new board", color: "#000000" })
    }

    // if (loading) {
    //     return <div className="flex items-center justify-center h-screen">
    //         <Loader2 className="animate-spin" size={24} />
    //         <span className="text-gray-600">Loading your boards...</span>
    //     </div>;
    // }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <h2 className="text-red-500"> Error loading boards</h2>
                <p className="text-red-500">{error}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={handleCreateBoard}
                    >
                        <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                            <Plus className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">Create Board</h3>
                        <p className="text-sm text-gray-500">
                            Start a new project with custom columns
                        </p>
                    </div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Total Boards</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{boards.length}</p>
                                </div>
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Trello className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">Recent Activity</p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        {
                                            boards.filter((board) => {
                                                const updatedAt = new Date(board.updated_at);
                                                const oneWeekAgo = new Date();
                                                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                                                return updatedAt > oneWeekAgo;
                                            }).length
                                        }
                                    </p>
                                </div>
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">📊</div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                                        Total Boards
                                    </p>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                        {boards.length}
                                    </p>
                                </div>
                                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Trello className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
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
                            <Button variant="outline" size="sm">
                                <Filter />
                                Filter
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
                        <Input id="search" placeholder="Search boards..." className="pl-10" />
                    </div>
                    {/* Boards Grid/List */}
                    {boards.length === 0 ? (
                        <div>No boards yet</div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            {boards.map((board) => (
                                <Link key={board.id} href={`/dashboard/${board.id}`} className="block h-full">
                                    <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className={`w-4 h-4 ${board.color} rounded`} />
                                                <Badge className="text-xs" variant="secondary">New</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4 sm:p-6 flex flex-col flex-grow">
                                            <CardTitle className="text-base sm:text-lg mb-2 group-hover:text-blue-600 transition-colors">{board.title}</CardTitle>
                                            <CardDescription className="text-sm mb-4 flex-grow">{board.description}</CardDescription>
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 space-y-1 sm:space-y-0 mt-auto">
                                                <span>Created{" "}{new Date(board.created_at).toLocaleDateString()}</span>
                                                <span>Updated{" "}{new Date(board.updated_at).toLocaleDateString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors cursor-pointer group h-full min-h-[200px]">
                                <CardContent className="p-4 sm:p-6 flex flex-col items-center justify-center h-full">
                                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                                    <p className="text-sm sm:text-base text-gray-600 group-hover:text-blue-600 font-medium">Create new board</p>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}   