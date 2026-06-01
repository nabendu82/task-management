"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEEKDAY_LABELS } from "@/lib/constants";
import { SeriesEndType } from "@/lib/seriesUtils";

type SeriesSchedulerFieldsProps = {
    enabled: boolean;
    onEnabledChange?: (enabled: boolean) => void;
    weekdays: number[];
    onWeekdaysChange: (weekdays: number[]) => void;
    endType: SeriesEndType;
    onEndTypeChange: (endType: SeriesEndType) => void;
    occurrenceCount: number;
    onOccurrenceCountChange: (count: number) => void;
    endDate: string;
    onEndDateChange: (date: string) => void;
    showToggle?: boolean;
};

export default function SeriesSchedulerFields({
    enabled,
    onEnabledChange,
    weekdays,
    onWeekdaysChange,
    endType,
    onEndTypeChange,
    occurrenceCount,
    onOccurrenceCountChange,
    endDate,
    onEndDateChange,
    showToggle = true,
}: SeriesSchedulerFieldsProps) {
    function toggleWeekday(day: number) {
        if (weekdays.includes(day)) {
            onWeekdaysChange(weekdays.filter((d) => d !== day));
        } else {
            onWeekdaysChange([...weekdays, day].sort((a, b) => a - b));
        }
    }

    function selectEveryDay() {
        onWeekdaysChange([0, 1, 2, 3, 4, 5, 6]);
    }

    if (showToggle && onEnabledChange) {
        return (
            <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <Label className="text-sm font-semibold text-violet-950">Recurring series</Label>
                        <p className="text-xs text-violet-700/80 mt-0.5">Repeat on selected days of the week</p>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant={enabled ? "default" : "outline"}
                        onClick={() => onEnabledChange(!enabled)}
                    >
                        {enabled ? "On" : "Off"}
                    </Button>
                </div>
                {enabled && (
                    <SeriesSchedulerBody
                        weekdays={weekdays}
                        toggleWeekday={toggleWeekday}
                        selectEveryDay={selectEveryDay}
                        endType={endType}
                        onEndTypeChange={onEndTypeChange}
                        occurrenceCount={occurrenceCount}
                        onOccurrenceCountChange={onOccurrenceCountChange}
                        endDate={endDate}
                        onEndDateChange={onEndDateChange}
                    />
                )}
            </div>
        );
    }

    if (!enabled) return null;

    return (
        <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-3">
            <div>
                <Label className="text-sm font-semibold text-violet-950">Series schedule</Label>
                <p className="text-xs text-violet-700/80 mt-0.5">Repeat on selected days of the week</p>
            </div>
            <SeriesSchedulerBody
                weekdays={weekdays}
                toggleWeekday={toggleWeekday}
                selectEveryDay={selectEveryDay}
                endType={endType}
                onEndTypeChange={onEndTypeChange}
                occurrenceCount={occurrenceCount}
                onOccurrenceCountChange={onOccurrenceCountChange}
                endDate={endDate}
                onEndDateChange={onEndDateChange}
            />
        </div>
    );
}

function SeriesSchedulerBody({
    weekdays,
    toggleWeekday,
    selectEveryDay,
    endType,
    onEndTypeChange,
    occurrenceCount,
    onOccurrenceCountChange,
    endDate,
    onEndDateChange,
}: {
    weekdays: number[];
    toggleWeekday: (day: number) => void;
    selectEveryDay: () => void;
    endType: SeriesEndType;
    onEndTypeChange: (endType: SeriesEndType) => void;
    occurrenceCount: number;
    onOccurrenceCountChange: (count: number) => void;
    endDate: string;
    onEndDateChange: (date: string) => void;
}) {
    return (
        <>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Repeat on</Label>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={selectEveryDay}>
                        Every day
                    </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {WEEKDAY_LABELS.map((label, day) => (
                        <Button
                            key={label}
                            type="button"
                            size="sm"
                            variant={weekdays.includes(day) ? "default" : "outline"}
                            className="h-8 min-w-10 px-2 text-xs"
                            onClick={() => toggleWeekday(day)}
                        >
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-xs">Ends</Label>
                <Select value={endType} onValueChange={(val) => onEndTypeChange((val || "count") as SeriesEndType)}>
                    <SelectTrigger>
                        <SelectValue>
                            {(value) => value === "until" ? "On a date" : "After number of occurrences"}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="count">After number of occurrences</SelectItem>
                        <SelectItem value="until">On a date</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {endType === "count" ? (
                <div className="space-y-1.5">
                    <Label htmlFor="occurrenceCount" className="text-xs">Number of occurrences</Label>
                    <Input
                        id="occurrenceCount"
                        type="number"
                        min={1}
                        max={500}
                        value={occurrenceCount}
                        onChange={(e) => onOccurrenceCountChange(Math.max(1, Number(e.target.value) || 1))}
                    />
                </div>
            ) : (
                <div className="space-y-1.5">
                    <Label htmlFor="seriesEndDate" className="text-xs">End date</Label>
                    <Input
                        id="seriesEndDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndDateChange(e.target.value)}
                    />
                </div>
            )}
        </>
    );
}
