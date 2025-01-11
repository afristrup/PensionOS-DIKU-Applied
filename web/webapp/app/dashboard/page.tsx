'use client';

import { useEffect, useState } from "react";
import { Clock, Plus, Search, User, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchStore } from "@/lib/store/searchStore";
import { useClientStore } from "@/lib/store/clientStore";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";

export default function DashboardPage() {
    const router = useRouter();
    const { searchResults, isLoading, setSearchResults, setTotalResults, addPlan } = useSearchStore();
    const { clients, fetchClients } = useClientStore();
    const [selectedClient, setSelectedClient] = useState<string>("all");
    const [isNewPlanDialogOpen, setIsNewPlanDialogOpen] = useState(false);
    const [newPlan, setNewPlan] = useState({
        company_name: '',
        plan_type: '401(k)',
        description: '',
        tags: '',
        total_participants: 0,
        total_assets: 0,
        avg_contribution_rate: 0
    });

    useEffect(() => {
        fetchClients();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/search/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: '',
                    limit: 10,
                    include_documents: true
                }),
            });
            const data = await response.json();
            setSearchResults(data.plans);
            setTotalResults(data.total);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        }
    };

    const filteredPlans = selectedClient === "all" 
        ? searchResults 
        : searchResults?.filter(plan => plan.client_id && plan.client_id.toString() === selectedClient);

    const totalPlans = filteredPlans?.length || 0;
    const totalParticipants = filteredPlans?.reduce((acc, plan) => acc + plan.total_participants, 0) || 0;
    const totalDocuments = filteredPlans?.reduce((acc, plan) => acc + plan.documents.length, 0) || 0;

    const handleCreatePlan = async () => {
        try {
            await addPlan(newPlan);
            setIsNewPlanDialogOpen(false);
            setNewPlan({
                company_name: '',
                plan_type: '401(k)',
                description: '',
                tags: '',
                total_participants: 0,
                total_assets: 0,
                avg_contribution_rate: 0
            });
            // Refresh plans
            fetchPlans();
        } catch (error) {
            console.error('Failed to create plan:', error);
        }
    };

    return (
        <div className="container mx-auto py-10 space-y-8 px-6">
            <div className="flex flex-col space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Manage your pension plans and documents
                </p>
            </div>

            <div className="flex items-center justify-between">
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Clients</SelectItem>
                        {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={() => router.push('/clients')}>
                    <User className="mr-2 h-4 w-4" />
                    Manage Clients
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Search</CardTitle>
                        <CardDescription>
                            Search through plans or ask questions about your pension plans
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Ask me anything about your pension plans..."
                                    className="pl-8"
                                />
                            </div>
                            <Dialog>
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Plans</CardTitle>
                        <CardDescription>
                            Your most recently updated pension plans
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="text-center py-4">Loading...</div>
                            ) : filteredPlans?.length === 0 ? (
                                <div className="text-center py-4 text-muted-foreground">
                                    No plans found
                                </div>
                            ) : (
                                filteredPlans?.slice(0, 5).map((plan) => (
                                    <div key={plan.id} className="flex items-center justify-between p-4 rounded-lg border">
                                        <div className="flex items-center space-x-4">
                                            <FileText className="h-8 w-8 text-primary" />
                                            <div>
                                                <p className="font-medium">{plan.company_name}</p>
                                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                    <span>Client: {plan.client_name}</span>
                                                    <span>•</span>
                                                    <span>Last updated {new Date(plan.updated_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline">{plan.plan_type}</Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                            <CardDescription>
                                Overview of your pension plans
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <p className="text-sm font-medium">Total Plans</p>
                                    <p className="text-2xl font-bold">{totalPlans}</p>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <p className="text-sm font-medium">Active Participants</p>
                                    <p className="text-2xl font-bold">{totalParticipants}</p>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <p className="text-sm font-medium">Documents</p>
                                    <p className="text-2xl font-bold">{totalDocuments}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                Latest updates and changes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredPlans?.slice(0, 3).map((plan) => (
                                    <div key={plan.id} className="flex items-center space-x-4">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Plan Updated: {plan.company_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(plan.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
