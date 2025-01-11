'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Search,
    Upload,
    User,
    Settings,
    Bell,
    MessageSquare,
    Menu,
    Home,
    Network,
} from "lucide-react";

const navigation = [
    {
        name: "Home",
        href: "/",
        icon: Home
    },
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard
    },
    {
        name: "Clients",
        href: "/clients",
        icon: User
    },
    {
        name: "Search",
        href: "/search",
        icon: Search
    },
    {
        name: "Knowledge Graph",
        href: "/knowledge-graph",
        icon: Network
    },
    {
        name: "Chat",
        href: "/chat",
        icon: MessageSquare
    },
    {
        name: "Upload",
        href: "/upload",
        icon: Upload
    }
];

export function Nav() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="flex md:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-2">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                            <nav className="flex flex-col space-y-4">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center space-x-2 px-2 py-1.5 text-sm font-medium",
                                                pathname === item.href
                                                    ? "text-foreground"
                                                    : "text-foreground/60 hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <Link href="/" className="flex items-center space-x-2 px-4">
                        <span className="font-bold">PensionOS</span>
                    </Link>
                </div>
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="flex items-center space-x-2 pl-4">
                        <span className="hidden font-bold sm:inline-block">
                            PensionOS
                        </span>
                    </Link>
                    <nav className="flex items-center pl-4 space-x-6 text-sm font-medium">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center space-x-2",
                                        pathname === item.href
                                            ? "text-foreground"
                                            : "text-foreground/60 hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative"
                            aria-label="Notifications"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Settings"
                            asChild
                        >
                            <Link href="/settings">
                                <Settings className="h-4 w-4" />
                            </Link>
                        </Button>
                    </nav>
                </div>
            </div>
        </header>
    );
} 