import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pili BatchPilot",
  description:
    "Compare supplier offers with a buyer order and processing capacity to find the best pili buying plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <div className="h-1 bg-brand" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
