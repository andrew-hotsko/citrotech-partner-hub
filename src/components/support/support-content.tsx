"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  User,
  Wrench,
  Package,
  HelpCircle,
  ExternalLink,
  Siren,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const contacts = [
  {
    name: "Sarah Chen",
    role: "Partner Program Manager",
    description: "Partnership inquiries, certification, and training coordination",
    email: "sarah.chen@citrotech.com",
    icon: User,
    color: "text-citro-orange",
    bgColor: "bg-citro-orange/10",
  },
  {
    name: "Mike Rodriguez",
    role: "Technical Support",
    description: "Product specifications, installation guidance, and troubleshooting",
    email: "mike.rodriguez@citrotech.com",
    icon: Wrench,
    color: "text-forest-teal",
    bgColor: "bg-forest-teal/10",
  },
  {
    name: "Lisa Park",
    role: "Orders & Logistics",
    description: "Order status, shipping updates, and delivery coordination",
    email: "lisa.park@citrotech.com",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
];

const faqItems = [
  {
    question: "How do I place a bulk order?",
    answer:
      "Navigate to the Orders page and click 'New Order'. For bulk orders (50+ units), select the 'Bulk Order' option to access volume pricing. You can also contact Lisa Park directly for custom bulk arrangements and delivery scheduling.",
  },
  {
    question: "What's the difference between MFB-31 and MFB-34?",
    answer:
      "MFB-31 is formulated for vegetation treatment and is applied to landscaping, trees, and surrounding brush to create a fire-resistant perimeter. MFB-34 is designed for structural treatment and is applied directly to building exteriors, roofing, and decking materials. Both are EPA Safer Choice certified and non-toxic. Refer to the product specification sheets in the Document Library for detailed technical comparisons.",
  },
  {
    question: "How do I renew my certification?",
    answer:
      "Your certification status and expiration date are shown on your Profile page. To renew, complete the online recertification module available in the Training section at least 30 days before expiration. If your certification has already lapsed, contact Sarah Chen to arrange an in-person or virtual recertification session.",
  },
  {
    question: "What are the shipping timelines?",
    answer:
      "Standard orders ship within 3-5 business days. Bulk orders (50+ units) typically ship within 7-10 business days. Emergency/expedited shipping is available for active fire situations -- contact Lisa Park or call the Emergency Hotline for same-day dispatch. All shipments include tracking information sent to your registered email.",
  },
  {
    question: "How do I access my order history?",
    answer:
      "Go to the Orders page to view your complete order history, including order status, tracking numbers, and invoices. You can filter by date range, status, and product type. For orders placed before your portal account was created, contact Lisa Park for historical records.",
  },
  {
    question: "How do I download marketing materials?",
    answer:
      "Visit the Document Library page to browse categories and download available resources including product brochures, installation guides, sales collateral, and training materials. All documents are kept up to date with the latest product information.",
  },
  {
    question: "What products are available?",
    answer:
      "MFB-31 for vegetation treatment and MFB-34 for structural treatment are our primary products. Both are EPA Safer Choice certified. Visit the Document Library for detailed product specifications, safety data sheets, and application guidelines.",
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: "easeOut" as const },
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SupportContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Get help from the CitroTech team"
      />

      {/* Emergency hotline */}
      <motion.div
        custom={0}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card className="border-l-4" style={{ borderLeftColor: "#DC2626" }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-500/10 p-2.5 shrink-0">
                <AlertTriangle
                  className="h-5 w-5 text-red-600"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-red-600">
                  Emergency Fire Defense Hotline
                </CardTitle>
                <CardDescription className="mt-1">
                  Available 24/7 for active fire situations
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="tel:1-800-CITRO-911"
              className="inline-flex items-center gap-2 text-xl font-bold font-display text-text-primary hover:text-citro-orange transition-colors"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
              1-800-CITRO-911
            </a>
            <div className="flex flex-col sm:flex-row gap-2 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                <a
                  href="mailto:emergency@citrotech.com"
                  className="hover:text-red-600 transition-colors"
                >
                  emergency@citrotech.com
                </a>
              </div>
              <span className="hidden sm:inline text-text-muted" aria-hidden="true">&middot;</span>
              <div className="flex items-center gap-2">
                <Siren className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
                <span>For expedited emergency shipments and field support</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Standard support */}
      <motion.div
        custom={1}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <CardTitle>Need help?</CardTitle>
            <CardDescription>
              Reach out to our team for general inquiries and support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3">
                <Mail
                  className="h-4 w-4 shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs text-text-muted">Email</p>
                  <a
                    href="mailto:partners@citrotech.com"
                    className="text-sm text-text-primary hover:text-citro-orange transition-colors"
                  >
                    partners@citrotech.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone
                  className="h-4 w-4 shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs text-text-muted">Phone</p>
                  <a
                    href="tel:5551234567"
                    className="text-sm text-text-primary hover:text-citro-orange transition-colors"
                  >
                    (555) 123-4567
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock
                  className="h-4 w-4 shrink-0 text-text-muted"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs text-text-muted">Hours</p>
                  <p className="text-sm text-text-primary">
                    Monday&ndash;Friday 8am&ndash;5pm PST
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/messages?subject=Support%20Request">
                <Button className="gap-2">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  Send a Message
                </Button>
              </Link>
              <a href="mailto:partners@citrotech.com">
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Email Us
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contacts */}
      <motion.div
        custom={2}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-lg font-semibold font-display text-text-primary mb-4">
          Your CitroTech Contacts
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, idx) => {
            const Icon = contact.icon;
            return (
              <motion.div
                key={contact.name}
                custom={idx + 3}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
              >
                <Card className="h-full">
                  <CardHeader className="gap-2">
                    <div
                      className={cn(
                        "rounded-full p-2.5 w-fit",
                        contact.bgColor
                      )}
                    >
                      <Icon
                        className={cn("h-5 w-5", contact.color)}
                        aria-hidden="true"
                      />
                    </div>
                    <CardTitle className="text-base">{contact.name}</CardTitle>
                    <CardDescription>{contact.role}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-text-muted">
                      {contact.description}
                    </p>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-citro-orange transition-colors"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                      <Link
                        href={`/messages?subject=Question%20for%20${encodeURIComponent(contact.name)}`}
                        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-citro-orange transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Send a message</span>
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        custom={6}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle
                className="h-5 w-5 text-text-muted shrink-0"
                aria-hidden="true"
              />
              <CardTitle>Frequently Asked Questions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single">
              {faqItems.map((item, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-text-secondary leading-relaxed">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
