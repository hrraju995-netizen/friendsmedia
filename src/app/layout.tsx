import type { Metadata } from "next";
import type { Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";
import "@/app/globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Friends Media",
  description: "A private media-sharing app built with Next.js, Auth.js, Prisma, Supabase, and Google Drive.",
  manifest: "/manifest.webmanifest",
  applicationName: "Friends Media",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Friends Media",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#214D42",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="strip-extension-attrs" strategy="beforeInteractive">
          {`
            (() => {
              const shouldRemove = (name) => name.startsWith("bis_") || name.startsWith("__processed_");
              const cleanNode = (node) => {
                if (!(node instanceof Element)) return;
                for (const attr of [...node.getAttributeNames()]) {
                  if (shouldRemove(attr)) {
                    node.removeAttribute(attr);
                  }
                }
              };
              const cleanTree = (root) => {
                cleanNode(root);
                if (!(root instanceof Element || root instanceof Document)) return;
                for (const element of root.querySelectorAll("*")) {
                  cleanNode(element);
                }
              };
              const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                  if (mutation.type === "attributes" && shouldRemove(mutation.attributeName || "")) {
                    cleanNode(mutation.target);
                  }
                  for (const node of mutation.addedNodes) {
                    cleanTree(node);
                  }
                }
              });

              const start = () => {
                cleanTree(document.documentElement);
                observer.observe(document.documentElement, {
                  subtree: true,
                  childList: true,
                  attributes: true,
                });
                requestAnimationFrame(() => cleanTree(document.documentElement));
                window.addEventListener("load", () => {
                  cleanTree(document.documentElement);
                  observer.disconnect();
                }, { once: true });
              };

              start();
              document.addEventListener("DOMContentLoaded", () => cleanTree(document.documentElement), { once: true });
            })();
          `}
        </Script>
      </head>
      <body suppressHydrationWarning className={`${fraunces.variable} ${manrope.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
