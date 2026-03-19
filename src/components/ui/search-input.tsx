"use client";

import React, { forwardRef, useCallback, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  SearchInput                                                        */
/* ------------------------------------------------------------------ */
export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      value,
      onChange,
      debounceMs = 300,
      placeholder = "Search\u2026",
      ...props
    },
    ref
  ) => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const internalRef = useRef<HTMLInputElement | null>(null);

    // Merge refs
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref]
    );

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (timerRef.current) clearTimeout(timerRef.current);

      if (debounceMs > 0) {
        timerRef.current = setTimeout(() => onChange(next), debounceMs);
      } else {
        onChange(next);
      }

      // Update the DOM input immediately for responsive feel
      if (internalRef.current) {
        internalRef.current.value = next;
      }
    };

    const handleClear = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      onChange("");
      if (internalRef.current) {
        internalRef.current.value = "";
        internalRef.current.focus();
      }
    };

    return (
      <div className={cn("relative", className)}>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
          aria-hidden="true"
        />

        <input
          ref={setRefs}
          type="text"
          role="searchbox"
          defaultValue={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "flex h-11 w-full rounded-lg border border-border bg-card pl-9 pr-9 py-2",
            "text-sm text-text-primary placeholder:text-text-muted",
            "font-body",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citro-orange focus-visible:ring-offset-0",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          {...props}
        />

        {value && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:text-text-primary hover:bg-secondary-bg transition-colors"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

export { SearchInput };
