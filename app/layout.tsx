import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accommodation Desk | Image Coffee Roastery",
  description: "Room reservations, availability and revenue tracking for Image Coffee Roastery accommodation."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}