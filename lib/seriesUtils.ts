export function formatDateKey(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export function parseDateKey(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
}

export type SeriesEndType = "count" | "until";

export function generateOccurrenceDates(config: {
    startDate: string;
    weekdays: number[];
    endType: SeriesEndType;
    occurrenceCount?: number;
    endDate?: string;
}): string[] {
    const { startDate, weekdays, endType, occurrenceCount, endDate } = config;
    if (weekdays.length === 0) return [];

    const dates: string[] = [];
    let current = parseDateKey(startDate);
    const hardLimit = 500;
    let iterations = 0;

    while (iterations < hardLimit) {
        const key = formatDateKey(current);
        if (endType === "until" && endDate && key > endDate) break;

        if (weekdays.includes(current.getDay())) {
            dates.push(key);
            if (endType === "count" && occurrenceCount && dates.length >= occurrenceCount) break;
        }

        current.setDate(current.getDate() + 1);
        iterations++;
    }

    return dates;
}

export const DEFAULT_SERIES_WEEKDAYS = [1, 2, 3, 4, 5];
