"use client"

import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string        // "HH:MM" 24-hour
  onChange: (value: string) => void
  className?: string
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, "0"))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))
const PERIODS = ["AM", "PM"]

const ITEM_H = 36
const VISIBLE = 5

function ScrollColumn({
  items,
  selected,
  onSelect,
  label,
}: {
  items: string[]
  selected: string
  onSelect: (v: string) => void
  label: string
}) {
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const idx = items.indexOf(selected)
    if (idx >= 0 && listRef.current) {
      listRef.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" })
    }
  }, [selected, items])

  function scrollBy(delta: number) {
    const idx = items.indexOf(selected)
    const next = Math.max(0, Math.min(items.length - 1, idx + delta))
    onSelect(items[next])
  }

  return (
    <div className="flex flex-col items-center gap-1" aria-label={label}>
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      <div
        ref={listRef}
        className="overflow-y-auto snap-y snap-mandatory flex flex-col w-12"
        style={{ height: ITEM_H * VISIBLE, scrollbarWidth: "none" }}
      >
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "snap-start flex items-center justify-center text-sm rounded-md transition-colors shrink-0",
              item === selected
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            style={{ height: ITEM_H }}
          >
            {item}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hh, mm] = value.split(":")
  const hour24 = parseInt(hh, 10)
  const period = hour24 >= 12 ? "PM" : "AM"
  const hour12 = hour24 % 12 === 0 ? "12" : String(hour24 % 12).padStart(2, "0")
  const minuteVal = String(Math.round(parseInt(mm, 10) / 5) * 5).padStart(2, "0")
  const minuteSnapped = minuteVal === "60" ? "00" : minuteVal

  function update(h12: string, min: string, per: string) {
    let h = parseInt(h12, 10)
    if (per === "AM") h = h === 12 ? 0 : h
    else h = h === 12 ? 12 : h + 12
    onChange(`${String(h).padStart(2, "0")}:${min}`)
  }

  return (
    <div className={cn("flex items-center gap-1 p-3", className)}>
      <ScrollColumn
        label="Hour"
        items={HOURS}
        selected={hour12}
        onSelect={(h) => update(h, minuteSnapped, period)}
      />
      <span className="text-muted-foreground font-bold text-xl pb-1 select-none">:</span>
      <ScrollColumn
        label="Minute"
        items={MINUTES}
        selected={minuteSnapped}
        onSelect={(m) => update(hour12, m, period)}
      />
      <div className="w-px self-stretch bg-border mx-1" />
      <ScrollColumn
        label="Period"
        items={PERIODS}
        selected={period}
        onSelect={(p) => update(hour12, minuteSnapped, p)}
      />
    </div>
  )
}
