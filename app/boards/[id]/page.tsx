"use client";

import Navbar from "@/components/navbar";
import { useBoard } from "@/lib/hooks/useBoards";
import { useParams } from "next/navigation";

export default function BoardPage() {
    const { id } = useParams();
    const { board, columns, loading, error } = useBoard(id as string);
    return (
        <>
            <div className="min-h-screen bg-gray-50">
                <Navbar boardTitle={board?.title} />
            </div>
        </>
    )
}