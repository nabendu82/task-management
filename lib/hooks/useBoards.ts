"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Board } from "../supabase/models";
import { boardDataService } from "../services";

export function useBoards() {
    const { user } = useUser();
    const [boards, setBoards] = useState<Board[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function createBoard(boardData: { title: string, description?: string, color?: string }) {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const newBoard = await boardDataService.createBoardWithDefaultColumns({
                ...boardData,
                userId: user.id
            });
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