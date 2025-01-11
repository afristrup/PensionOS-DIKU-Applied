'use client';

import { useEffect, useState } from "react";
import { useClientStore } from "@/lib/store/clientStore";
import { useChatStore } from "@/lib/store/chatStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, User, Edit, Trash2, Phone, Mail, Building, Upload, MessageSquare, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChatHistory } from "@/components/chat/ChatHistory";

export default function ClientsPage() {
  const { clients, isLoading, error, fetchClients, addClient, updateClient, deleteClient } = useClientStore();
  const { messages, uploads, fetchMessages, fetchUploads, addMessage, uploadFile } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [deletingClient, setDeletingClient] = useState<number | null>(null);
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("details");
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient !== null) {
        await updateClient(editingClient, formData);
        toast({
          title: "Success",
          description: "Client updated successfully",
        });
      } else {
        await addClient({ ...formData, status: 'active' });
        toast({
          title: "Success", 
          description: "Client added successfully",
        });
      }
      setIsAddDialogOpen(false);
      setEditingClient(null);
      setFormData({ name: "", email: "", phone: "", company: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save client",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (client: any) => {
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
    });
    setEditingClient(client.id);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingClient === null) return;
    
    try {
      await deleteClient(deletingClient);
      toast({
        title: "Success",
        description: "Client deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete client",
        variant: "destructive",
      });
    } finally {
      setDeletingClient(null);
    }
  };

  const handleClientSelect = async (clientId: number) => {
    setSelectedClient(clientId);
    await Promise.all([
      fetchMessages(clientId),
      fetchUploads(clientId)
    ]);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedClient) return;
    
    try {
      await addMessage(selectedClient, content, 'user');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async () => {
    if (!selectedClient || !selectedFile) return;
    
    try {
      await uploadFile(selectedClient, selectedFile);
      setSelectedFile(null);
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8 px-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Manage your client portfolio
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingClient ? "Update Client" : "Add Client"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Client List</CardTitle>
              <CardDescription>View and manage your clients</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : error ? (
                    <div className="text-center py-4 text-destructive">
                      {error}
                      <Button 
                        variant="outline" 
                        className="ml-2"
                        onClick={() => fetchClients()}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      {searchQuery ? "No clients found matching your search" : "No clients found. Add your first client!"}
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer ${
                          selectedClient === client.id ? "border-primary" : ""
                        }`}
                        onClick={() => handleClientSelect(client.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <User className="h-8 w-8 text-primary" />
                          <div className="space-y-1">
                            <p className="font-medium">{client.name}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Building className="mr-1 h-3 w-3" />
                                {client.company}
                              </span>
                              <span className="flex items-center">
                                <Mail className="mr-1 h-3 w-3" />
                                {client.email}
                              </span>
                              <span className="flex items-center">
                                <Phone className="mr-1 h-3 w-3" />
                                {client.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingClient(client.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-8">
          {selectedClient ? (
            <Card>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <CardHeader>
                  <TabsList>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="chat">Chat History</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="details">
                    <div className="space-y-4">
                      {clients.find(c => c.id === selectedClient)?.name}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chat">
                    <ChatHistory
                      messages={messages as any}
                      isLoading={isLoading}
                      onSendMessage={handleSendMessage}
                    />
                  </TabsContent>
                  
                  <TabsContent value="documents">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                        <Button onClick={handleFileUpload} disabled={!selectedFile}>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                          {uploads?.map((upload) => (
                            <div
                              key={upload.id}
                              className="flex items-center justify-between p-4 rounded-lg border"
                            >
                              <div className="flex items-center space-x-4">
                                <FileText className="h-6 w-6" />
                                <div>
                                  <p className="font-medium">{upload.filename}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(upload.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge>{upload.status}</Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-[600px] text-muted-foreground">
                Select a client to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={deletingClient !== null} onOpenChange={(open) => !open && setDeletingClient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the client and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 