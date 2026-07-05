"use client"

import { useMemo, useRef, useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"

export interface ComboboxOption {
  /** Text written into the field when this option is picked. */
  value: string
  /** Primary display line in the dropdown. */
  label: string
  /** Optional secondary line (e.g. an email under a contact name). */
  description?: string
}

interface ComboboxProps {
  value: string
  /** Fires on both free typing and option selection — the field's text value. */
  onValueChange: (value: string) => void
  options: ComboboxOption[]
  /** Fires ONLY when an existing option is picked (not on free text), so callers
   *  can fill sibling fields — e.g. selecting a contact also fills their email. */
  onSelectOption?: (option: ComboboxOption) => void
  placeholder?: string
  loading?: boolean
  id?: string
  type?: string
  required?: boolean
}

// Match predicate: case-insensitive substring on the label OR its description, so a
// contact is findable by name or email. Swap this out to change ranking/fuzziness.
function matches(option: ComboboxOption, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return option.label.toLowerCase().includes(q)
    || (option.description?.toLowerCase().includes(q) ?? false)
}

export function Combobox({
  value,
  onValueChange,
  options,
  onSelectOption,
  placeholder,
  loading,
  id,
  type,
  required,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => options.filter(o => matches(o, value)), [options, value])

  function choose(option: ComboboxOption) {
    onValueChange(option.value)
    onSelectOption?.(option)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); choose(filtered[active]) }
    else if (e.key === "Escape") { setOpen(false) }
  }

  return (
    <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          id={id}
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          autoComplete="off"
          onChange={e => { onValueChange(e.target.value); setActive(0); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[--radix-popover-trigger-width] p-1 max-h-60 overflow-y-auto"
        // Keep focus in the input so typing continues while the list is open.
        onOpenAutoFocus={e => e.preventDefault()}
        onCloseAutoFocus={e => e.preventDefault()}
        // The input is the anchor, not inside the content, so a click on it counts as an
        // "outside" interaction and would instantly dismiss the popover. Ignore those.
        onInteractOutside={e => {
          const target = e.target as Node | null
          if (target && inputRef.current?.contains(target)) e.preventDefault()
        }}
      >
        {loading ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</p>
        ) : (
          filtered.map((option, i) => {
            const selected = option.value === value
            return (
              <button
                key={`${option.value}-${i}`}
                type="button"
                // preventDefault stops the input from blurring before the click lands.
                onMouseDown={e => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(option)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                  i === active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                )}
              >
                <Check className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                <span className="min-w-0">
                  <span className="block truncate">{option.label}</span>
                  {option.description && (
                    <span className="block truncate text-xs text-muted-foreground">{option.description}</span>
                  )}
                </span>
              </button>
            )
          })
        )}
      </PopoverContent>
    </Popover>
  )
}
