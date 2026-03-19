"use client";

import React, {
  forwardRef,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Accordion Context                                                  */
/* ------------------------------------------------------------------ */
interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (value: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx)
    throw new Error(
      "Accordion compound components must be used within <Accordion>"
    );
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Item Context                                                       */
/* ------------------------------------------------------------------ */
interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null
);

function useAccordionItem() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx)
    throw new Error(
      "AccordionTrigger/AccordionContent must be used within <AccordionItem>"
    );
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Accordion                                                          */
/* ------------------------------------------------------------------ */
export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
}

const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", defaultValue, className, children, ...props }, ref) => {
    const [openItems, setOpenItems] = useState<Set<string>>(() => {
      if (!defaultValue) return new Set();
      return new Set(Array.isArray(defaultValue) ? defaultValue : [defaultValue]);
    });

    const toggle = useCallback(
      (value: string) => {
        setOpenItems((prev) => {
          const next = new Set(prev);
          if (next.has(value)) {
            next.delete(value);
          } else {
            if (type === "single") next.clear();
            next.add(value);
          }
          return next;
        });
      },
      [type]
    );

    return (
      <AccordionContext.Provider value={{ openItems, toggle, type }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

/* ------------------------------------------------------------------ */
/*  AccordionItem                                                      */
/* ------------------------------------------------------------------ */
export interface AccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openItems } = useAccordion();
    const isOpen = openItems.has(value);

    return (
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div
          ref={ref}
          className={cn("border-b border-border", className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

/* ------------------------------------------------------------------ */
/*  AccordionTrigger                                                   */
/* ------------------------------------------------------------------ */
export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { toggle } = useAccordion();
    const { value, isOpen } = useAccordionItem();

    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center justify-between py-4 text-left",
          "text-sm font-medium text-text-primary",
          "cursor-pointer transition-colors hover:text-citro-orange",
          className
        )}
        onClick={() => toggle(value)}
        {...props}
      >
        {children}
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 ml-2"
        >
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </motion.span>
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

/* ------------------------------------------------------------------ */
/*  AccordionContent                                                   */
/* ------------------------------------------------------------------ */
export interface AccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = useAccordionItem();

    return (
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            ref={ref}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div
              className={cn("pb-4 text-sm text-text-secondary", className)}
              {...props}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
