import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ordered palette of 20 visually distinct board colors (Tailwind class names).
 * Used to auto-assign colors to new boards and to style board cards.
 */
export const BOARD_COLOR_PALETTE = [
    "bg-blue-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-cyan-500",
    "bg-rose-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-lime-500",
    "bg-red-500",
    "bg-sky-500",
    "bg-fuchsia-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-stone-500",
    "bg-slate-500",
    "bg-gray-500",
] as const;

/**
 * Returns the next color from the palette for a new board.
 * Cycles through all 20 colors before repeating.
 */
export function getNextBoardColor(existingBoardCount: number): string {
    return BOARD_COLOR_PALETTE[existingBoardCount % BOARD_COLOR_PALETTE.length];
}

export function getBoardColorStyles(colorClass?: string) {
    switch (colorClass) {
        case "bg-blue-500":
            return {
                bg: "bg-blue-50/80",
                border: "border-blue-200/80",
                text: "text-blue-950",
                accent: "text-blue-700",
                dot: "bg-blue-500",
                badge: "bg-blue-100 text-blue-800"
            };
        case "bg-orange-500":
            return {
                bg: "bg-orange-50/80",
                border: "border-orange-200/80",
                text: "text-orange-950",
                accent: "text-orange-700",
                dot: "bg-orange-500",
                badge: "bg-orange-100 text-orange-800"
            };
        case "bg-pink-500":
            return {
                bg: "bg-pink-50/80",
                border: "border-pink-200/80",
                text: "text-pink-950",
                accent: "text-pink-700",
                dot: "bg-pink-500",
                badge: "bg-pink-100 text-pink-800"
            };
        case "bg-emerald-500":
            return {
                bg: "bg-emerald-50/80",
                border: "border-emerald-200/80",
                text: "text-emerald-950",
                accent: "text-emerald-700",
                dot: "bg-emerald-500",
                badge: "bg-emerald-100 text-emerald-800"
            };
        case "bg-violet-500":
            return {
                bg: "bg-violet-50/80",
                border: "border-violet-200/80",
                text: "text-violet-950",
                accent: "text-violet-700",
                dot: "bg-violet-500",
                badge: "bg-violet-100 text-violet-800"
            };
        case "bg-amber-500":
            return {
                bg: "bg-amber-50/80",
                border: "border-amber-200/80",
                text: "text-amber-950",
                accent: "text-amber-700",
                dot: "bg-amber-500",
                badge: "bg-amber-100 text-amber-800"
            };
        case "bg-cyan-500":
            return {
                bg: "bg-cyan-50/80",
                border: "border-cyan-200/80",
                text: "text-cyan-950",
                accent: "text-cyan-700",
                dot: "bg-cyan-500",
                badge: "bg-cyan-100 text-cyan-800"
            };
        case "bg-rose-500":
            return {
                bg: "bg-rose-50/80",
                border: "border-rose-200/80",
                text: "text-rose-950",
                accent: "text-rose-700",
                dot: "bg-rose-500",
                badge: "bg-rose-100 text-rose-800"
            };
        case "bg-teal-500":
            return {
                bg: "bg-teal-50/80",
                border: "border-teal-200/80",
                text: "text-teal-950",
                accent: "text-teal-700",
                dot: "bg-teal-500",
                badge: "bg-teal-100 text-teal-800"
            };
        case "bg-indigo-500":
            return {
                bg: "bg-indigo-50/80",
                border: "border-indigo-200/80",
                text: "text-indigo-950",
                accent: "text-indigo-700",
                dot: "bg-indigo-500",
                badge: "bg-indigo-100 text-indigo-800"
            };
        case "bg-lime-500":
            return {
                bg: "bg-lime-50/80",
                border: "border-lime-200/80",
                text: "text-lime-950",
                accent: "text-lime-700",
                dot: "bg-lime-500",
                badge: "bg-lime-100 text-lime-800"
            };
        case "bg-red-500":
            return {
                bg: "bg-red-50/80",
                border: "border-red-200/80",
                text: "text-red-950",
                accent: "text-red-700",
                dot: "bg-red-500",
                badge: "bg-red-100 text-red-800"
            };
        case "bg-sky-500":
            return {
                bg: "bg-sky-50/80",
                border: "border-sky-200/80",
                text: "text-sky-950",
                accent: "text-sky-700",
                dot: "bg-sky-500",
                badge: "bg-sky-100 text-sky-800"
            };
        case "bg-fuchsia-500":
            return {
                bg: "bg-fuchsia-50/80",
                border: "border-fuchsia-200/80",
                text: "text-fuchsia-950",
                accent: "text-fuchsia-700",
                dot: "bg-fuchsia-500",
                badge: "bg-fuchsia-100 text-fuchsia-800"
            };
        case "bg-green-500":
            return {
                bg: "bg-green-50/80",
                border: "border-green-200/80",
                text: "text-green-950",
                accent: "text-green-700",
                dot: "bg-green-500",
                badge: "bg-green-100 text-green-800"
            };
        case "bg-yellow-500":
            return {
                bg: "bg-yellow-50/80",
                border: "border-yellow-200/80",
                text: "text-yellow-950",
                accent: "text-yellow-700",
                dot: "bg-yellow-500",
                badge: "bg-yellow-100 text-yellow-800"
            };
        case "bg-purple-500":
            return {
                bg: "bg-purple-50/80",
                border: "border-purple-200/80",
                text: "text-purple-950",
                accent: "text-purple-700",
                dot: "bg-purple-500",
                badge: "bg-purple-100 text-purple-800"
            };
        case "bg-stone-500":
            return {
                bg: "bg-stone-50/80",
                border: "border-stone-200/80",
                text: "text-stone-950",
                accent: "text-stone-700",
                dot: "bg-stone-500",
                badge: "bg-stone-100 text-stone-800"
            };
        case "bg-slate-500":
            return {
                bg: "bg-slate-50/80",
                border: "border-slate-200/80",
                text: "text-slate-950",
                accent: "text-slate-700",
                dot: "bg-slate-500",
                badge: "bg-slate-100 text-slate-800"
            };
        case "bg-gray-500":
            return {
                bg: "bg-gray-50/80",
                border: "border-gray-200/80",
                text: "text-gray-950",
                accent: "text-gray-700",
                dot: "bg-gray-500",
                badge: "bg-gray-100 text-gray-800"
            };
        default:
            return {
                bg: "bg-slate-50/80",
                border: "border-slate-200/80",
                text: "text-slate-950",
                accent: "text-slate-700",
                dot: "bg-slate-500",
                badge: "bg-slate-100 text-slate-800"
            };
    }
}
