"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-near-black px-12">
        <div className="max-w-md text-center">
          <img
            src="/logo.png"
            alt="CitroTech"
            className="h-14 w-auto object-contain mb-4 mx-auto"
          />

          <p className="text-lg font-medium text-neutral-400 uppercase tracking-[0.2em] mb-8 font-display">
            Certified Partner Hub
          </p>

          <div className="w-12 h-px bg-citro-orange/40 mx-auto mb-8" />

          <p className="text-neutral-500 text-sm leading-relaxed font-body">
            Your one-stop resource for marketing materials, product orders, and
            partnership management.
          </p>
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-6 py-12">
        <SignIn
          appearance={{
            elements: {
              rootBox: "w-full max-w-md",
              card: "shadow-none bg-transparent",
              headerTitle: "text-text-primary",
              headerSubtitle: "text-text-secondary",
              formButtonPrimary:
                "bg-citro-orange hover:bg-citro-orange-dark text-white shadow-none",
              footerActionLink:
                "text-citro-orange hover:text-citro-orange-dark",
            },
          }}
        />
      </div>
    </div>
  );
}
