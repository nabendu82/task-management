"use client"

import Navbar from "@/components/navbar";
import { useUser } from "@clerk/nextjs";
import { useBoards } from "@/lib/hooks/useBoards";
import { Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trello } from "lucide-react";

export default function DashboardPage() {
    const { user } = useUser();
    const { createBoard, boards, loading, error } = useBoards();

    const handleCreateBoard = () => {
        createBoard({ title: "New Board", description: "A new board", color: "#000000" })
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-gray-600">Loading your boards...</span>
        </div>;
    }

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            </main>
        </div>
    );
}   