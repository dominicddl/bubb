import { create } from 'zustand';

interface SidePanelState {
  activeTab: 'this-page' | 'continue-learning';
  selectedTopicId: string | null;
  selectedTopicName: string | null;
  isSearchOpen: boolean;
  searchQuery: string;
  setActiveTab: (tab: 'this-page' | 'continue-learning') => void;
  openTopic: (topicId: string, topicName: string) => void;
  closeTopic: () => void;
  toggleSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
}

export const useSidePanelStore = create<SidePanelState>((set) => ({
  activeTab: 'this-page',
  selectedTopicId: null,
  selectedTopicName: null,
  isSearchOpen: false,
  searchQuery: '',
  setActiveTab: (tab) => set({ activeTab: tab, selectedTopicId: null, selectedTopicName: null }),
  openTopic: (topicId, topicName) => set({ selectedTopicId: topicId, selectedTopicName: topicName }),
  closeTopic: () => set({ selectedTopicId: null, selectedTopicName: null }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen, searchQuery: '' })),
  closeSearch: () => set({ isSearchOpen: false, searchQuery: '' }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
