"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FolderOpen,
  ShoppingCart,
  MessageSquare,
  Bell,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "citrotech-welcome-dismissed";

const tourItems = [
  {
    icon: FolderOpen,
    title: "Document Library",
    description:
      "Browse our document library for marketing materials and technical specs",
    color: "bg-blue-500/15 text-blue-500 ring-blue-500/20",
  },
  {
    icon: ShoppingCart,
    title: "Place Orders",
    description:
      "Place orders for MFB-31 and MFB-34 products",
    color: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/20",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description:
      "Message the CitroTech team directly",
    color: "bg-purple-500/15 text-purple-500 ring-purple-500/20",
  },
  {
    icon: Bell,
    title: "Announcements",
    description:
      "Stay updated with announcements",
    color: "bg-amber-500/15 text-amber-500 ring-amber-500/20",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Small delay so the page loads first
        const timer = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // localStorage not available
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleDismiss();
      else setOpen(isOpen);
    }}>
      <DialogContent className="max-w-md overflow-hidden">
        {/* Orange accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-citro-orange to-citro-orange-dark" />

        <DialogHeader className="pt-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="rounded-full bg-citro-orange/15 p-2.5 ring-1 ring-citro-orange/20">
              <span className="text-lg font-bold font-display text-citro-orange">C</span>
            </div>
            <DialogTitle className="text-xl">
              Welcome to the CitroTech Partner Hub!
            </DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            Your central hub for everything you need as a CitroTech partner. Here is a quick overview of what you can do:
          </DialogDescription>
        </DialogHeader>

        {/* Tour items */}
        <div className="px-6 py-4 space-y-3">
          {tourItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.3 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary-bg/50 hover:bg-secondary-bg transition-colors"
              >
                <div
                  className={`shrink-0 rounded-full p-2 ring-1 ${item.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary font-display">
                    {item.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer with CTA */}
        <div className="px-6 pb-6 pt-2">
          <Button
            fullWidth
            size="lg"
            onClick={handleDismiss}
            className="gap-2"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
