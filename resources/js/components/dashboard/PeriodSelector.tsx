// components/dashboard/PeriodSelector.tsx
"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { router } from "@inertiajs/react"
import { useState } from "react"

interface PeriodSelectorProps {
    currentPeriod: string;
}

const periodOptions = [
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "12months", label: "Last 12 Months" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
]

export function PeriodSelector({ currentPeriod }: PeriodSelectorProps) {
    const [period, setPeriod] = useState(currentPeriod)

    const handlePeriodChange = (value: string) => {
        setPeriod(value)
        router.get(`/dashboard?period=${value}`)
    }

    return (
        <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
                {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}