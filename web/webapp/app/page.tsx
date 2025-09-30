'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText, Search, Upload, Users, MessageSquare, Network, Building2 } from "lucide-react";
import { useSearchStore } from "@/lib/store/searchStore";
import { mockQuickStats } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";

interface QuickStats {
    totalPlans: number;
    totalParticipants: number;
    totalAssets: number;
    avgContributionRate?: number;
    planTypeDistribution?: Record<string, number>;
    recentActivity?: Array<{
        type: string;
        plan: string;
        description: string;
        date: string;
    }>;
}

export default function Home() {
    const { useMockData } = useSearchStore();
    const [mounted, setMounted] = useState(false);
    const [stats, setStats] = useState<QuickStats>({
        totalPlans: 0,
        totalParticipants: 0,
        totalAssets: 0
    });

    useEffect(() => {
        setMounted(true);
        setStats(useMockData ? mockQuickStats : {
            totalPlans: 1234,
            totalParticipants: 5678,
            totalAssets: 23456
        });
    }, [useMockData]);

    const formatNumber = (num: number): string => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const formatCurrency = (num: number): string => {
        const millions = (num / 1000000).toFixed(1);
        return `$${millions.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}M`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0].replace(/-/g, '/');
    };

    if (!mounted) {
        return null; // Return null on server-side to prevent hydration mismatch
    }

    return (
        <div className="container mx-auto py-10 space-y-8 px-6">
            <div className="relative isolate">
                <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                    aria-hidden="true">
                    <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        style={{
                            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
                        }} />
                </div>

                <div className="flex flex-col items-center text-center space-y-6 py-24 sm:py-32">
                    <div className="space-y-2">
                        <Badge variant="outline" className="mb-4">
                            Pension Management Simplified
                        </Badge>
                        <h1 className={cn(
                            "text-4xl font-bold tracking-tight sm:text-6xl",
                            "bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400",
                            "bg-clip-text text-transparent",
                            "[-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
                        )}>
                            Welcome to PensionOS
                        </h1>
                        <p className="text-muted-foreground max-w-[600px] text-lg sm:text-xl leading-8">
                            Your comprehensive platform for managing pension plans and employee benefits with advanced AI-powered insights
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <Button size="lg" asChild>
                            <Link href="/dashboard">
                                Get Started
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/search">
                                Try Search
                                <Search className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 text-center">
                        <div>
                            <div className="text-4xl font-bold">{formatNumber(stats.totalPlans)}</div>
                            <div className="text-sm text-muted-foreground mt-1">Total Plans</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold">{formatNumber(stats.totalParticipants)}</div>
                            <div className="text-sm text-muted-foreground mt-1">Participants</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold">{formatCurrency(stats.totalAssets)}</div>
                            <div className="text-sm text-muted-foreground mt-1">Total Assets</div>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                    aria-hidden="true">
                    <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                        style={{
                            clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)'
                        }} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Search className="h-5 w-5" />
                            <span>Search Plans</span>
                        </CardTitle>
                        <CardDescription>
                            Search through pension plans and documents
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/search">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Upload className="h-5 w-5" />
                            <span>Upload Documents</span>
                        </CardTitle>
                        <CardDescription>
                            Upload and manage plan documents
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/upload">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Users className="h-5 w-5" />
                            <span>Manage Plans</span>
                        </CardTitle>
                        <CardDescription>
                            View and manage pension plans
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/dashboard">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <MessageSquare className="h-5 w-5" />
                            <span>Chat Assistant</span>
                        </CardTitle>
                        <CardDescription>
                            Get help with pension-related questions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/chat">
                                Start Chat
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Network className="h-5 w-5" />
                            <span>Knowledge Graph</span>
                        </CardTitle>
                        <CardDescription>
                            Explore document relationships and insights
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/knowledge-graph">
                                Explore
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Building2 className="h-5 w-5" />
                            <span>Clients</span>
                        </CardTitle>
                        <CardDescription>
                            Manage and view client information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" variant="outline" asChild>
                            <Link href="/clients">
                                View Clients
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                        <CardDescription>
                            Platform overview
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Total Plans</p>
                                <p className="text-2xl font-bold">{stats.totalPlans}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Total Participants</p>
                                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Total Assets</p>
                                <p className="text-2xl font-bold">${(stats.totalAssets / 1000000).toFixed(1)}M</p>
                            </div>
                            {useMockData && stats.avgContributionRate && stats.planTypeDistribution && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Avg Contribution Rate</p>
                                        <p className="text-2xl font-bold">{stats.avgContributionRate}%</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Plan Types</p>
                                        <div className="flex gap-2">
                                            {Object.entries(stats.planTypeDistribution).map(([type, count]) => (
                                                <Badge key={type} variant="outline">
                                                    {type}: {count}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Updates</CardTitle>
                        <CardDescription>
                            Latest platform updates and features
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {useMockData && stats.recentActivity ? (
                                stats.recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-start space-x-4">
                                        <FileText className="h-5 w-5 mt-0.5 text-primary" />
                                        <div>
                                            <p className="font-medium">{activity.plan}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {activity.description} - {formatDate(activity.date)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-start space-x-4">
                                        <FileText className="h-5 w-5 mt-0.5 text-primary" />
                                        <div>
                                            <p className="font-medium">Enhanced Search Capabilities</p>
                                            <p className="text-sm text-muted-foreground">
                                                New semantic search feature allows natural language queries across all pension plan documents.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <FileText className="h-5 w-5 mt-0.5 text-primary" />
                                        <div>
                                            <p className="font-medium">Automated Compliance Checks</p>
                                            <p className="text-sm text-muted-foreground">
                                                Real-time validation against latest ERISA regulations and DOL requirements.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <FileText className="h-5 w-5 mt-0.5 text-primary" />
                                        <div>
                                            <p className="font-medium">Document Management</p>
                                            <p className="text-sm text-muted-foreground">
                                                Improved document organization with automatic categorization and tagging.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
