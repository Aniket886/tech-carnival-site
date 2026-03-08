import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollegeOption {
  id: string;
  name: string;
  short_name: string | null;
}

interface CollegePickerProps {
  colleges: CollegeOption[];
  value: string;
  onChange: (collegeName: string) => void;
  onOtherClick: () => void;
  className?: string;
  placeholder?: string;
}

const CollegePicker = ({
  colleges,
  value,
  onChange,
  onOtherClick,
  className,
  placeholder = "Select college",
}: CollegePickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return colleges;
    const q = search.toLowerCase();
    return colleges.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.short_name && c.short_name.toLowerCase().includes(q))
    );
  }, [colleges, search]);

  // Total items = filtered colleges + 1 ("Other" button)
  const totalItems = filtered.length + 1;

  useEffect(() => {
    if (open) {
      setSearch("");
      setHighlightIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightIdx(0);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-picker-item]");
    items[highlightIdx]?.scrollIntoView({ block: "nearest" });
  }, [highlightIdx]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((i) => (i + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((i) => (i - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (highlightIdx < filtered.length) {
          onChange(filtered[highlightIdx].name);
          setOpen(false);
        } else {
          // "Other" option
          setOpen(false);
          onOtherClick();
        }
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [totalItems, filtered, highlightIdx, onChange, onOtherClick]
  );

  const displayValue = value
    ? colleges.find((c) => c.name === value)
      ? (() => {
          const c = colleges.find((c) => c.name === value)!;
          return `${c.name}${c.short_name ? ` (${c.short_name})` : ""}`;
        })()
      : value
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal h-9 px-3",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {displayValue || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search colleges…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div ref={listRef} className="max-h-48 overflow-y-auto p-1">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              No colleges found
            </p>
          )}
          {filtered.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              data-picker-item
              onClick={() => {
                onChange(c.name);
                setOpen(false);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-left transition-colors",
                idx === highlightIdx
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
                value === c.name && idx !== highlightIdx && "bg-accent/50"
              )}
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  value === c.name ? "opacity-100 text-primary" : "opacity-0"
                )}
              />
              <span className="truncate">
                {c.name}
                {c.short_name && (
                  <span className="text-muted-foreground"> ({c.short_name})</span>
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-1">
          <button
            type="button"
            data-picker-item
            onClick={() => {
              setOpen(false);
              onOtherClick();
            }}
            onMouseEnter={() => setHighlightIdx(filtered.length)}
            className={cn(
              "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary transition-colors",
              highlightIdx === filtered.length
                ? "bg-accent"
                : "hover:bg-accent"
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Other (Add new college)
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CollegePicker;
