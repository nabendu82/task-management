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
export type RecurrenceType = "weekly" | "monthly";

export function generateWeeklyOccurrenceDates(config: {
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

export function generateMonthlyOccurrenceDates(config: {
    startDate: string;
    monthDay: number;
    endType: SeriesEndType;
    occurrenceCount?: number;
    endDate?: string;
}): string[] {
    const { startDate, monthDay, endType, occurrenceCount, endDate } = config;

    const dates: string[] = [];
    const start = parseDateKey(startDate);
    // Begin from the month of startDate; if the day-of-month hasn't passed yet,
    // include the current month, otherwise start from next month.
    let year = start.getFullYear();
    let month = start.getMonth(); // 0-indexed
    const startDay = start.getDate();
    if (startDay > monthDay) {
        month += 1;
        if (month > 11) { month = 0; year += 1; }
    }

    const hardLimit = 500;
    let iterations = 0;

    while (iterations < hardLimit) {
        // Check if this month actually has the target day (e.g., Feb 30 doesn't exist)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        if (monthDay <= daysInMonth) {
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(monthDay).padStart(2, "0")}`;
            if (endType === "until" && endDate && key > endDate) break;
            dates.push(key);
            if (endType === "count" && occurrenceCount && dates.length >= occurrenceCount) break;
        }

        month += 1;
        if (month > 11) { month = 0; year += 1; }
        iterations++;
    }

    return dates;
}

export function generateOccurrenceDates(config: {
    startDate: string;
    recurrenceType?: RecurrenceType;
    weekdays: number[];
    monthDay?: number | null;
    endType: SeriesEndType;
    occurrenceCount?: number;
    endDate?: string;
}): string[] {
    if (config.recurrenceType === "monthly") {
        return generateMonthlyOccurrenceDates({
            startDate: config.startDate,
            monthDay: config.monthDay ?? parseDateKey(config.startDate).getDate(),
            endType: config.endType,
            occurrenceCount: config.occurrenceCount,
            endDate: config.endDate,
        });
    }
    return generateWeeklyOccurrenceDates({
        startDate: config.startDate,
        weekdays: config.weekdays,
        endType: config.endType,
        occurrenceCount: config.occurrenceCount,
        endDate: config.endDate,
    });
}

export const DEFAULT_SERIES_WEEKDAYS = [1, 2, 3, 4, 5];

