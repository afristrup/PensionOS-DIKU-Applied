"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Send, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // First, get relevant documents through search
      const searchResponse = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: input,
          limit: 5,
          include_documents: true,
        }),
      })

      const searchData = await searchResponse.json()

      // Then, send the chat request with context
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          context: searchData.documents,
        }),
      })

      const chatData = await chatResponse.json()

      if (chatData.message) {
        const assistantMessage: Message = {
          role: "assistant",
          content: chatData.message,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Error:", error)
      // Add error message to chat
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-w-4xl mx-auto p-4">
      <Card className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation by sending a message below.</p>
                <p className="text-sm">Ask me anything about pension plans and documents!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-4",
                    message.role === "assistant" ? "bg-muted" : "bg-accent"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Bot className="w-6 h-6 mt-1" />
                  ) : (
                    <User className="w-6 h-6 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">
                      {message.role === "assistant" ? "Assistant" : "You"}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-pulse text-muted-foreground">Thinking...</div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
} 