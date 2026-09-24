import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Luma | Student support operations", description: "A focused workspace for equitable student support." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
