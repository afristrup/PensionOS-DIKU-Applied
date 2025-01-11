'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Send, Bot } from "lucide-react";
import { format } from 'date-fns';

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<void>;
}

export function ChatHistory({ messages, isLoading, onSendMessage }: ChatHistoryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (inputRef.current?.value.trim()) {
      await onSendMessage(inputRef.current.value);
      inputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="flex flex-col gap-1">
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'user' ? (
                    <MessageSquare className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
              </div>

              {/* Message bubble */}
              <div
                className={`flex flex-col gap-1 max-w-[80%] ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <Card
                  className={`px-4 py-2 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </Card>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Type your message..."
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
} 