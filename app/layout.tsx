import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talli",
  description:
    "Compare supplier offers with a buyer order and processing capacity to find the best pili buying plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <a
          href="#processing-pathway"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-40 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:outline-2 focus:outline-offset-2 focus:outline-foreground"
        >
          Skip to the form
        </a>
        {children}
      </body>
    </html>
  );
}
