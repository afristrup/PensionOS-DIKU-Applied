import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mockKnowledgeGraph, mockPensionPlans } from '../mockData'

export interface Plan {
  id: string
  company_name: string
  plan_type: string
  updated_at: string
  description: string
  tags: string
  documents: Document[]
  total_participants: number
  total_assets: number
  avg_contribution_rate: number
  client_id?: number
  client_name?: string
}

export interface Document {
  id: string
  filename: string
  created_at: string
}

interface PersistedState {
  useMockData: boolean
}

interface SearchStore extends PersistedState {
  documents: Document[]
  searchResults: Plan[] | null
  isLoading: boolean
  isUploading: boolean
  totalResults: number
  knowledgeGraph: any
  setDocuments: (documents: Document[]) => void
  setSearchResults: (results: Plan[] | null) => void
  setIsLoading: (loading: boolean) => void
  setIsUploading: (uploading: boolean) => void
  setTotalResults: (total: number) => void
  setUseMockData: (useMock: boolean) => void
  searchMockData: (query: string) => void
  uploadDocument: (planId: string, file: File) => Promise<void>
  addPlan: (plan: Omit<Plan, 'id' | 'updated_at' | 'documents'>) => Promise<void>
}

export const useSearchStore = create<SearchStore>()(
  persist(
    (set, get) => ({
      documents: [],
      searchResults: null,
      isLoading: false,
      isUploading: false,
      totalResults: 0,
      useMockData: true,
      knowledgeGraph: mockKnowledgeGraph,

      setDocuments: (documents) => set({ documents }),
      setSearchResults: (results) => set({ searchResults: results }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setIsUploading: (uploading) => set({ isUploading: uploading }),
      setTotalResults: (total) => set({ totalResults: total }),
      setUseMockData: (useMock) => set({ useMockData: useMock }),

      searchMockData: (query) => {
        const lowercaseQuery = query.toLowerCase();
        const filteredPlans = mockPensionPlans.filter((plan) => {
          return (
            plan.company_name.toLowerCase().includes(lowercaseQuery) ||
            plan.description.toLowerCase().includes(lowercaseQuery) ||
            plan.plan_type.toLowerCase().includes(lowercaseQuery) ||
            plan.tags.toLowerCase().includes(lowercaseQuery)
          );
        });
        set({ searchResults: filteredPlans, totalResults: filteredPlans.length });
      },

      uploadDocument: async (planId, file) => {
        set({ isUploading: true });
        try {
          if (get().useMockData) {
            // Simulate upload delay
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const newDoc = {
              id: `doc${Date.now()}`,
              filename: file.name,
              created_at: new Date().toISOString(),
            };
            set((state) => ({
              searchResults: state.searchResults?.map((plan) =>
                plan.id === planId
                  ? { ...plan, documents: [...plan.documents, newDoc] }
                  : plan
              ) || null,
            }));
            return;
          }

          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/documents/${planId}/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error('Failed to upload document');
          }

          const newDoc = await response.json();
          set((state) => ({
            searchResults: state.searchResults?.map((plan) =>
              plan.id === planId
                ? { ...plan, documents: [...plan.documents, newDoc] }
                : plan
            ) || null,
          }));
        } catch (error) {
          console.error('Upload error:', error);
          throw error;
        } finally {
          set({ isUploading: false });
        }
      },

      addPlan: async (planData) => {
        set({ isLoading: true });
        try {
          if (get().useMockData) {
            const newPlan: Plan = {
              id: `plan${Date.now()}`,
              ...planData,
              updated_at: new Date().toISOString(),
              documents: []
            };
            
            set((state) => ({
              searchResults: state.searchResults 
                ? [...state.searchResults, newPlan]
                : [newPlan],
              totalResults: (state.totalResults || 0) + 1
            }));
            return;
          }

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/plans/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(planData),
          });

          if (!response.ok) {
            throw new Error('Failed to create plan');
          }

          const newPlan = await response.json();
          set((state) => ({
            searchResults: state.searchResults 
              ? [...state.searchResults, newPlan]
              : [newPlan],
            totalResults: (state.totalResults || 0) + 1
          }));
        } catch (error) {
          console.error('Create plan error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'search-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ useMockData: state.useMockData }),
    }
  )
); 