"use client";

import React, {
  forwardRef,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */
interface SheetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("Sheet compound components must be used within <Sheet>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Sheet (root)                                                       */
/* ------------------------------------------------------------------ */
export interface SheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Sheet({ children, open: controlledOpen, onOpenChange }: SheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  SheetTrigger                                                       */
/* ------------------------------------------------------------------ */
export interface SheetTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const SheetTrigger = forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ onClick, children, ...props }, ref) => {
    const { setOpen } = useSheet();

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          setOpen(true);
          onClick?.(e);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SheetTrigger.displayName = "SheetTrigger";

/* ------------------------------------------------------------------ */
/*  SheetContent                                                       */
/* ------------------------------------------------------------------ */
export interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "right" | "left";
}

const SheetContent = forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = "right", children }, ref) => {
    const { open, setOpen } = useSheet();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Lock body scroll when open
    useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = "";
        };
      }
    }, [open]);

    // Close on Escape
    useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open, setOpen]);

    if (!mounted) return null;

    const slideFrom = side === "right" ? "100%" : "-100%";

    return createPortal(
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              className={cn(
                "fixed z-50 top-0 bottom-0 flex flex-col",
                "w-full max-w-md bg-card border-border shadow-xl",
                side === "right" ? "right-0 border-l" : "left-0 border-r",
                className
              )}
              initial={{ x: slideFrom }}
              animate={{ x: 0 }}
              exit={{ x: slideFrom }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Close button */}
              <button
                type="button"
                className="absolute top-4 right-4 rounded-md p-1.5 text-text-secondary hover:text-text-primary hover:bg-secondary-bg transition-colors"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);
SheetContent.displayName = "SheetContent";

/* ------------------------------------------------------------------ */
/*  SheetHeader                                                        */
/* ------------------------------------------------------------------ */
const SheetHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6 pb-0", className)}
    {...props}
  />
));
SheetHeader.displayName = "SheetHeader";

/* ------------------------------------------------------------------ */
/*  SheetTitle                                                         */
/* ------------------------------------------------------------------ */
const SheetTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold text-text-primary font-display",
      className
    )}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

/* ------------------------------------------------------------------ */
/*  SheetDescription                                                   */
/* ------------------------------------------------------------------ */
const SheetDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

/* ------------------------------------------------------------------ */
/*  SheetFooter                                                        */
/* ------------------------------------------------------------------ */
const SheetFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-3 p-6 pt-0 mt-auto",
      className
    )}
    {...props}
  />
));
SheetFooter.displayName = "SheetFooter";

/* ------------------------------------------------------------------ */
/*  SheetClose                                                         */
/* ------------------------------------------------------------------ */
const SheetClose = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, children, ...props }, ref) => {
  const { setOpen } = useSheet();
  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        setOpen(false);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
});
SheetClose.displayName = "SheetClose";

export {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
};
