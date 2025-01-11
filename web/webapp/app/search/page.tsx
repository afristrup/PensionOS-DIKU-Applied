'use client';

import { Clock, Search, User, Filter, FileText, Upload, Download, Eye, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { useSearchStore } from "@/lib/store/searchStore";
import { FileUpload } from "@/components/ui/file-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentViewer } from "@/components/ui/document-viewer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plan } from "@/lib/store/searchStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery] = useDebounce(searchQuery, 500);
    const [activeTab, setActiveTab] = useState<"search" | "directory">("directory");
    const [allPlans, setAllPlans] = useState<any[]>([]);
    const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);
    const [isNewPlanDialogOpen, setIsNewPlanDialogOpen] = useState(false);
    const [newPlan, setNewPlan] = useState({
        company_name: "",
        plan_type: "401(k)",
        description: "",
        tags: "",
        total_participants: 0,
        total_assets: 0,
        avg_contribution_rate: 0
    });
    const {
        searchResults,
        isLoading,
        isUploading,
        useMockData,
        setSearchResults,
        setIsLoading,
        setTotalResults,
        setUseMockData,
        searchMockData,
        uploadDocument,
        addPlan
    } = useSearchStore();
    const [selectedDocument, setSelectedDocument] = useState<{ url: string; filename: string } | null>(null);

    const handleCreatePlan = async () => {
        try {
            await addPlan(newPlan);
            setIsNewPlanDialogOpen(false);
            setNewPlan({
                company_name: "",
                plan_type: "401(k)",
                description: "",
                tags: "",
                total_participants: 0,
                total_assets: 0,
                avg_contribution_rate: 0
            });
            // Refresh the directory view
            if (activeTab === "directory") {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: "",
                        limit: 100,
                        include_documents: true
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch plans');
                }

                const data = await response.json();
                setAllPlans(data.plans);
            }
        } catch (error) {
            console.error('Failed to create plan:', error);
        }
    };

    // Fetch all plans for directory view
    useEffect(() => {
        const fetchAllPlans = async () => {
            if (useMockData) {
                searchMockData("");
                return;
            }

            setIsLoadingDirectory(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: "",
                        limit: 100,
                        include_documents: true
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch plans');
                }

                const data = await response.json();
                setAllPlans(data.plans);
            } catch (error) {
                console.error('Directory fetch error:', error);
            } finally {
                setIsLoadingDirectory(false);
            }
        };

        if (activeTab === "directory") {
            fetchAllPlans();
        }
    }, [activeTab, useMockData, searchMockData]);

    // Search effect
    useEffect(() => {
        const fetchResults = async () => {
            if (!debouncedQuery && !useMockData) {
                setSearchResults(null);
                return;
            }

            if (useMockData) {
                searchMockData(debouncedQuery);
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: debouncedQuery,
                        limit: 10,
                        include_documents: true
                    }),
                });

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const data = await response.json();
                setSearchResults(data.plans);
                setTotalResults(data.total);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults(null);
                setTotalResults(0);
            } finally {
                setIsLoading(false);
            }
        };

        if (activeTab === "search") {
            fetchResults();
        }
    }, [debouncedQuery, setSearchResults, setIsLoading, setTotalResults, activeTab, useMockData, searchMockData]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDownload = async (docId: string, filename: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${docId}/download`);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const renderPlanCard = (plan: Plan) => (
        <Card key={plan.id}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{plan.company_name}</CardTitle>
                    <Badge variant="outline">{plan.plan_type}</Badge>
                </div>
                <CardDescription>
                    Last updated {formatDate(plan.updated_at)}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="documents">
                            Documents ({plan.documents.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview">
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {plan.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {plan.tags.split(',').map((tag: string, index: number) => (
                                    <Badge key={index} variant="secondary">
                                        {tag.trim()}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="documents">
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Upload className="mr-2 h-4 w-4" />
                                            Upload Document
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Upload Document</DialogTitle>
                                        </DialogHeader>
                                        <FileUpload
                                            onUpload={(file) => uploadDocument(plan.id, file)}
                                            isUploading={isUploading}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <ScrollArea className="h-[300px] rounded-md border p-4">
                                <div className="grid gap-4">
                                    {plan.documents.map((doc: any) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between rounded-lg border p-4"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <FileText className="h-8 w-8 text-primary" />
                                                <div>
                                                    <p className="font-medium">
                                                        {doc.filename}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Uploaded {formatDate(doc.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setSelectedDocument({
                                                        url: `${process.env.NEXT_PUBLIC_API_URL}/documents/${doc.id}/content`,
                                                        filename: doc.filename
                                                    })}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">View</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDownload(doc.id, doc.filename)}
                                                >
                                                    <Download className="h-4 w-4" />
                                                    <span className="sr-only">Download</span>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto py-10 space-y-8 px-6">
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">Pension Plans</h1>
                    <Dialog open={isNewPlanDialogOpen} onOpenChange={setIsNewPlanDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Plan
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Pension Plan</DialogTitle>
                                <DialogDescription>
                                    Fill in the details below to create a new pension plan.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="company_name">Company Name</Label>
                                    <Input
                                        id="company_name"
                                        value={newPlan.company_name}
                                        onChange={(e) => setNewPlan({ ...newPlan, company_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="plan_type">Plan Type</Label>
                                    <Select
                                        value={newPlan.plan_type}
                                        onValueChange={(value) => setNewPlan({ ...newPlan, plan_type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select plan type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="401(k)">401(k)</SelectItem>
                                            <SelectItem value="Pension">Pension</SelectItem>
                                            <SelectItem value="403(b)">403(b)</SelectItem>
                                            <SelectItem value="IRA">IRA</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={newPlan.description}
                                        onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                                    <Input
                                        id="tags"
                                        value={newPlan.tags}
                                        onChange={(e) => setNewPlan({ ...newPlan, tags: e.target.value })}
                                        placeholder="e.g. retirement, matching, tech"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsNewPlanDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreatePlan} disabled={!newPlan.company_name || !newPlan.description}>
                                    Create Plan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                <p className="text-muted-foreground">
                    Browse or search through pension plans and their associated documents
                </p>
                <div className="flex space-x-4">
                    <Tabs 
                        value={activeTab} 
                        onValueChange={(value) => setActiveTab(value as "search" | "directory")} 
                        className="w-full"
                    >
                        <TabsList>
                            <TabsTrigger value="directory">Directory</TabsTrigger>
                            <TabsTrigger value="search">Search</TabsTrigger>
                        </TabsList>
                        <TabsContent value="directory">
                            <div className="grid gap-6">
                                {isLoadingDirectory ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-[200px] w-full" />
                                    ))
                                ) : (
                                    searchResults?.map((plan: Plan) => renderPlanCard(plan))
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="search">
                            <div className="space-y-6">
                                <div className="flex space-x-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={useMockData ? "Search using regex (e.g. '401.*k' or just type normally)" : "Search pension plans..."}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-6">
                                    {isLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-[200px] w-full" />
                                        ))
                                    ) : searchResults?.length === 0 ? (
                                        <p className="text-center text-muted-foreground">No results found</p>
                                    ) : (
                                        searchResults?.map((plan: Plan) => renderPlanCard(plan))
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            {selectedDocument && (
                <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
                    <DialogContent className="max-w-4xl h-[80vh]">
                        <DialogHeader>
                            <DialogTitle>{selectedDocument.filename}</DialogTitle>
                        </DialogHeader>
                        <DocumentViewer 
                            url={selectedDocument.url} 
                            filename={selectedDocument.filename}
                            isOpen={true}
                            onClose={() => setSelectedDocument(null)}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
} 