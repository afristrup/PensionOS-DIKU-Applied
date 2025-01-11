'use client';

import { Nav } from "@/components/nav";

interface RootLayoutProps {
    children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Nav />
            <main className="flex-1">{children}</main>
        </div>
    );
} 