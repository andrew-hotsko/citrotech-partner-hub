"use client";

import React, {
  forwardRef,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx)
    throw new Error(
      "DropdownMenu compound components must be used within <DropdownMenu>"
    );
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  DropdownMenu                                                       */
/* ------------------------------------------------------------------ */
export interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  DropdownMenuTrigger                                                */
/* ------------------------------------------------------------------ */
const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, children, ...props }, ref) => {
  const { open, setOpen, triggerRef } = useDropdownMenu();

  const combinedRef = useCallback(
    (node: HTMLButtonElement | null) => {
      (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current =
        node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ref, triggerRef]
  );

  return (
    <button
      ref={combinedRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={(e) => {
        setOpen(!open);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

/* ------------------------------------------------------------------ */
/*  DropdownMenuContent                                                */
/* ------------------------------------------------------------------ */
export interface DropdownMenuContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end" | "center";
  sideOffset?: number;
}

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, align = "end", sideOffset = 4, children }, ref) => {
    const { open, setOpen } = useDropdownMenu();
    const contentRef = useRef<HTMLDivElement | null>(null);

    // Close on outside click
    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (
          contentRef.current &&
          !contentRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };
      // Defer so the trigger click doesn't immediately close
      const id = setTimeout(() => {
        document.addEventListener("mousedown", handler);
      }, 0);
      return () => {
        clearTimeout(id);
        document.removeEventListener("mousedown", handler);
      };
    }, [open, setOpen]);

    // Close on Escape
    useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open, setOpen]);

    const combinedRef = useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref]
    );

    const alignClass =
      align === "start"
        ? "left-0"
        : align === "end"
          ? "right-0"
          : "left-1/2 -translate-x-1/2";

    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={combinedRef}
            role="menu"
            className={cn(
              "absolute z-50 min-w-[180px]",
              "bg-card border border-border rounded-lg shadow-lg",
              "py-1",
              alignClass,
              className
            )}
            style={{ top: `calc(100% + ${sideOffset}px)` }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

/* ------------------------------------------------------------------ */
/*  DropdownMenuItem                                                   */
/* ------------------------------------------------------------------ */
export interface DropdownMenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, destructive, onClick, children, ...props }, ref) => {
    const { setOpen } = useDropdownMenu();

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-sm",
          "text-left transition-colors duration-100 cursor-pointer",
          "focus-visible:outline-none focus-visible:bg-secondary-bg",
          destructive
            ? "text-error hover:bg-error/10"
            : "text-text-primary hover:bg-secondary-bg",
          className
        )}
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

/* ------------------------------------------------------------------ */
/*  DropdownMenuSeparator                                              */
/* ------------------------------------------------------------------ */
const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("my-1 h-px bg-border", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
