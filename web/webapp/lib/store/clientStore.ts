import { create } from 'zustand'
import { mockClients } from '../mockData'
import { useSearchStore } from './searchStore'

interface Client {
  id: number
  name: string
  email: string
  phone: string
  company: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  pension_plans: number[]
}

interface ClientStore {
  clients: Client[]
  selectedClient: Client | null
  isLoading: boolean
  error: string | null
  setClients: (clients: Client[]) => void
  setSelectedClient: (client: Client | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'pension_plans'>) => Promise<void>
  updateClient: (id: number, updates: Partial<Client>) => Promise<void>
  deleteClient: (id: number) => Promise<void>
  fetchClients: () => Promise<void>
  associateWithPlan: (clientId: number, planId: number) => Promise<void>
  dissociateFromPlan: (clientId: number, planId: number) => Promise<void>
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,
  error: null,
  setClients: (clients) => set({ clients }),
  setSelectedClient: (client) => set({ selectedClient: client }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  addClient: async (clientData) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        // Create new mock client
        const newClient: Client = {
          id: Math.max(0, ...mockClients.map(c => c.id)) + 1,
          ...clientData,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          pension_plans: []
        };
        
        set((state) => ({ 
          clients: [...state.clients, newClient],
          error: null
        }));
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add client');
      }
      
      const newClient = await response.json();
      set((state) => ({ clients: [...state.clients, newClient] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add client' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  updateClient: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        set((state) => ({
          clients: state.clients.map((c) => 
            c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
          ),
          selectedClient: state.selectedClient?.id === id 
            ? { ...state.selectedClient, ...updates, updated_at: new Date().toISOString() } 
            : state.selectedClient
        }));
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update client');
      }
      
      const updatedClient = await response.json();
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? updatedClient : c)),
        selectedClient: state.selectedClient?.id === id ? updatedClient : state.selectedClient,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update client' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  deleteClient: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
        }));
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
      
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete client' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        set({ 
          clients: mockClients,
          error: null
        });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/`);
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      
      const clients = await response.json();
      set({ clients, error: null });
    } catch (error) {
      set({ 
        clients: [], 
        error: error instanceof Error ? error.message : 'Failed to fetch clients'
      });
    } finally {
      set({ isLoading: false });
    }
  },

  associateWithPlan: async (clientId, planId) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.id === clientId) {
              return {
                ...c,
                pension_plans: [...c.pension_plans, planId]
              };
            }
            return c;
          }),
          selectedClient: state.selectedClient?.id === clientId
            ? {
                ...state.selectedClient,
                pension_plans: [...state.selectedClient.pension_plans, planId]
              }
            : state.selectedClient
        }));
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/pension-plans/${planId}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to associate client with pension plan');
      }
      
      set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              pension_plans: [...c.pension_plans, planId]
            };
          }
          return c;
        }),
        selectedClient: state.selectedClient?.id === clientId
          ? {
              ...state.selectedClient,
              pension_plans: [...state.selectedClient.pension_plans, planId]
            }
          : state.selectedClient
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to associate with pension plan' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  dissociateFromPlan: async (clientId, planId) => {
    set({ isLoading: true, error: null });
    try {
      const useMockData = useSearchStore.getState().useMockData;
      
      if (useMockData) {
        set((state) => ({
          clients: state.clients.map((c) => {
            if (c.id === clientId) {
              return {
                ...c,
                pension_plans: c.pension_plans.filter(id => id !== planId)
              };
            }
            return c;
          }),
          selectedClient: state.selectedClient?.id === clientId
            ? {
                ...state.selectedClient,
                pension_plans: state.selectedClient.pension_plans.filter(id => id !== planId)
              }
            : state.selectedClient
        }));
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/clients/${clientId}/pension-plans/${planId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to dissociate client from pension plan');
      }
      
      set((state) => ({
        clients: state.clients.map((c) => {
          if (c.id === clientId) {
            return {
              ...c,
              pension_plans: c.pension_plans.filter(id => id !== planId)
            };
          }
          return c;
        }),
        selectedClient: state.selectedClient?.id === clientId
          ? {
              ...state.selectedClient,
              pension_plans: state.selectedClient.pension_plans.filter(id => id !== planId)
            }
          : state.selectedClient
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to dissociate from pension plan' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
})); 