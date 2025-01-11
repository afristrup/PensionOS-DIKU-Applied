'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Bell, Moon, Sun, Globe, Loader2, Check, ArrowLeft } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/lib/store/searchStore";

interface Settings {
    notifications: boolean;
    emailNotifications: boolean;
    language: string;
    documentsPerPage: string;
    useMockData: boolean;
}

export default function SettingsPage() {
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const { useMockData, setUseMockData } = useSearchStore();
    const [settings, setSettings] = useState<Settings>({
        notifications: true,
        emailNotifications: true,
        language: 'en',
        documentsPerPage: '10',
        useMockData: false
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Load settings from backend on component mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                    // Sync mock data setting with the store
                    setUseMockData(data.useMockData);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };
        loadSettings();
    }, [setUseMockData]);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 2000);
                toast({
                    title: "Settings saved",
                    description: "Your preferences have been updated successfully.",
                });
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.back()}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Go back</span>
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                </div>
                <p className="text-muted-foreground">
                    Manage your application preferences and configurations
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>
                            Customize how PensionOS looks on your device
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Theme</Label>
                                <div className="text-sm text-muted-foreground">
                                    Choose between light and dark mode
                                </div>
                            </div>
                            <Select
                                value={theme}
                                onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">
                                        <div className="flex items-center">
                                            <Sun className="w-4 h-4 mr-2" />
                                            Light
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="dark">
                                        <div className="flex items-center">
                                            <Moon className="w-4 h-4 mr-2" />
                                            Dark
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>
                            Configure how you want to receive notifications
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Push Notifications</Label>
                                <div className="text-sm text-muted-foreground">
                                    Receive notifications about important updates
                                </div>
                            </div>
                            <Switch
                                checked={settings.notifications}
                                onCheckedChange={(checked: boolean) =>
                                    setSettings({ ...settings, notifications: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <div className="text-sm text-muted-foreground">
                                    Receive email updates about your pension plans
                                </div>
                            </div>
                            <Switch
                                checked={settings.emailNotifications}
                                onCheckedChange={(checked: boolean) =>
                                    setSettings({ ...settings, emailNotifications: checked })
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preferences</CardTitle>
                        <CardDescription>
                            Customize your experience with PensionOS
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Mock Data</Label>
                                <div className="text-sm text-muted-foreground">
                                    Use mock data for testing and demonstration
                                </div>
                            </div>
                            <Switch
                                checked={settings.useMockData}
                                onCheckedChange={(checked: boolean) => {
                                    setSettings({ ...settings, useMockData: checked });
                                    setUseMockData(checked);
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Language</Label>
                                <div className="text-sm text-muted-foreground">
                                    Select your preferred language
                                </div>
                            </div>
                            <Select
                                value={settings.language}
                                onValueChange={(value: string) => setSettings({ ...settings, language: value })}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">
                                        <div className="flex items-center">
                                            <Globe className="w-4 h-4 mr-2" />
                                            English
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="da">Danish</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Documents per page</Label>
                                <div className="text-sm text-muted-foreground">
                                    Number of documents to display per page
                                </div>
                            </div>
                            <Select
                                value={settings.documentsPerPage}
                                onValueChange={(value: string) =>
                                    setSettings({ ...settings, documentsPerPage: value })
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select amount" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button 
                        onClick={saveSettings} 
                        disabled={isSaving}
                        className="min-w-[120px]"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : showSuccess ? (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Saved!
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
} 