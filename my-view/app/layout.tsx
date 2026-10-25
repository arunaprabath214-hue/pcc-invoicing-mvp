import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "PCC MY VIEW", description: "Pure Custom Creation sales and data-entry workspace" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}