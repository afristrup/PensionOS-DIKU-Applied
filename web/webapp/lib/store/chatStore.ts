import { create } from 'zustand'
import { mockChats } from '../mockData'
import { useSearchStore } from './searchStore'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Upload {
  id: string
  filename: string
  status: string
  created_at: string
}

interface ChatStore {
  messages: Message[]
  uploads: Upload[]
  isLoading: boolean
  error: string | null
  selectedClientId: number | null
  setMessages: (messages: Message[]) => void
  setUploads: (uploads: Upload[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedClientId: (clientId: number | null) => void
  sendMessage: (content: string) => Promise<void>
  addMessage: (clientId: number, content: string, role: 'user' | 'assistant') => Promise<void>
  fetchMessages: (clientId: number) => Promise<void>
  fetchUploads: (clientId: number) => Promise<void>
  uploadFile: (clientId: number, file: File) => Promise<void>
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  uploads: [],
  isLoading: false,
  error: null,
  selectedClientId: null,
  setMessages: (messages) => set({ messages }),
  setUploads: (uploads) => set({ uploads }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedClientId: (clientId) => set({ selectedClientId: clientId }),

  addMessage: async (clientId: number, content: string, role: 'user' | 'assistant') => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        const newMessage: Message = {
          id: `mock-${Date.now()}`,
          role,
          content,
          created_at: new Date().toISOString()
        };

        set((state) => ({
          messages: [...state.messages, newMessage]
        }));
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          content,
          role
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add message');
      }

      const message = await response.json();
      set((state) => ({
        messages: [...state.messages, message]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add message' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content: string) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      const clientId = useChatStore.getState().selectedClientId;
      
      if (!clientId) {
        throw new Error('No client selected');
      }

      if (useMockData) {
        const newMessage: Message = {
          id: `mock-${Date.now()}`,
          role: 'user',
          content,
          created_at: new Date().toISOString()
        };

        // Add user message
        set((state) => ({
          messages: [...state.messages, newMessage]
        }));

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Add mock assistant response
        const assistantMessage: Message = {
          id: `mock-${Date.now() + 1}`,
          role: 'assistant',
          content: `This is a mock response to: "${content}". In mock data mode, responses are pre-defined.`,
          created_at: new Date().toISOString()
        };

        set((state) => ({
          messages: [...state.messages, assistantMessage]
        }));

        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      set((state) => ({
        messages: [...state.messages, data]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to send message' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (clientId: number) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        const mockClientMessages = mockChats[clientId] || [];
        set({ 
          messages: mockClientMessages,
          selectedClientId: clientId,
          error: null
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const messages = await response.json();
      set({ 
        messages,
        selectedClientId: clientId,
        error: null
      });
    } catch (error) {
      set({ 
        messages: [],
        error: error instanceof Error ? error.message : 'Failed to fetch messages'
      });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUploads: async (clientId: number) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        // Return empty array for mock data mode
        set({ 
          uploads: [],
          error: null
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/uploads`);
      if (!response.ok) {
        throw new Error('Failed to fetch uploads');
      }

      const uploads = await response.json();
      set({ 
        uploads,
        error: null
      });
    } catch (error) {
      set({ 
        uploads: [],
        error: error instanceof Error ? error.message : 'Failed to fetch uploads'
      });
    } finally {
      set({ isLoading: false });
    }
  },

  uploadFile: async (clientId: number, file: File) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        // Simulate upload in mock data mode
        const mockUpload: Upload = {
          id: `mock-${Date.now()}`,
          filename: file.name,
          status: 'completed',
          created_at: new Date().toISOString()
        };
        
        set((state) => ({
          uploads: [...state.uploads, mockUpload],
          error: null
        }));
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/uploads`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const upload = await response.json();
      set((state) => ({
        uploads: [...state.uploads, upload],
        error: null
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to upload file' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
})); 