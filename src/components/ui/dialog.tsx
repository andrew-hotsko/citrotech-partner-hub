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
interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog compound components must be used within <Dialog>");
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Dialog                                                             */
/* ------------------------------------------------------------------ */
export interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function Dialog({ children, open: controlledOpen, onOpenChange }: DialogProps) {
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
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  DialogTrigger                                                      */
/* ------------------------------------------------------------------ */
const DialogTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, children, ...props }, ref) => {
  const { setOpen } = useDialog();

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
});
DialogTrigger.displayName = "DialogTrigger";

/* ------------------------------------------------------------------ */
/*  DialogContent                                                      */
/* ------------------------------------------------------------------ */
export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children }, ref) => {
    const { open, setOpen } = useDialog();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Lock body scroll
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

    return createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              ref={ref}
              role="dialog"
              aria-modal="true"
              className={cn(
                "relative z-10 w-full max-w-lg",
                "bg-card border border-border rounded-[var(--radius-card)]",
                "shadow-xl",
                className
              )}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
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
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
);
DialogContent.displayName = "DialogContent";

/* ------------------------------------------------------------------ */
/*  DialogHeader                                                       */
/* ------------------------------------------------------------------ */
const DialogHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-6 pb-0", className)}
    {...props}
  />
));
DialogHeader.displayName = "DialogHeader";

/* ------------------------------------------------------------------ */
/*  DialogTitle                                                        */
/* ------------------------------------------------------------------ */
const DialogTitle = forwardRef<
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
DialogTitle.displayName = "DialogTitle";

/* ------------------------------------------------------------------ */
/*  DialogDescription                                                  */
/* ------------------------------------------------------------------ */
const DialogDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

/* ------------------------------------------------------------------ */
/*  DialogFooter                                                       */
/* ------------------------------------------------------------------ */
const DialogFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-3 p-6 pt-4",
      className
    )}
    {...props}
  />
));
DialogFooter.displayName = "DialogFooter";

/* ------------------------------------------------------------------ */
/*  DialogClose                                                        */
/* ------------------------------------------------------------------ */
const DialogClose = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, children, ...props }, ref) => {
  const { setOpen } = useDialog();
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
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};
