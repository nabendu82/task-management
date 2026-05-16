"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Board, Column } from "../supabase/models";
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

export function useBoard(boardId: string) {
    const { supabase } = useSupabase();
    const { user } = useUser();
    const [board, setBoard] = useState<Board | null>(null);
    const [columns, setColumns] = useState<Column[]>([]);
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
            setColumns(data.columns);
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

    return { board, columns, loading, error, updateBoard }
}