'use client';

import { useEffect, useState } from "react";
import { useClientStore } from "@/lib/store/clientStore";
import { useChatStore } from "@/lib/store/chatStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { useToast } from "@/components/ui/use-toast";

export default function ChatPage() {
  const { clients, fetchClients } = useClientStore();
  const { messages, isLoading, fetchMessages, addMessage } = useChatStore();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (selectedClient) {
      fetchMessages(parseInt(selectedClient));
    }
  }, [selectedClient, fetchMessages]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClient(clientId);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Please select a client first",
        variant: "destructive",
      });
      return;
    }

    try {
      await addMessage(parseInt(selectedClient), content, 'user');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Chat Assistant</h1>
        <p className="text-muted-foreground">
          Chat with our AI assistant about pension plans and documents
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Client Selection */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Select Client</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedClient || ""}
                onValueChange={handleClientSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name} - {client.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedClient
                  ? `Chat with ${
                      clients.find((c) => c.id.toString() === selectedClient)?.name
                    }`
                  : "Select a client to start chatting"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedClient ? (
                <ChatHistory
                  messages={messages as any}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                />
              ) : (
                <div className="flex items-center justify-center h-[600px] text-muted-foreground">
                  Please select a client from the list to start chatting
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 