"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Board } from "../supabase/models";
import { boardDataService, boardService } from "../services";
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