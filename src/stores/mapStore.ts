import { create } from 'zustand';
import type { OrgMap, OrgNode, UnassignedMember, HistoryEntry } from '@/types';

interface MapState {
  // Current map data
  currentMap: OrgMap | null;
  nodes: OrgNode[];
  unassignedMembers: UnassignedMember[];
  history: HistoryEntry[];

  // UI state
  selectedNodeId: string | null;
  isLoading: boolean;
  isSaving: boolean;

  // Actions
  setCurrentMap: (map: OrgMap | null) => void;
  setNodes: (nodes: OrgNode[]) => void;
  addNode: (node: OrgNode) => void;
  updateNode: (id: string, updates: Partial<OrgNode>) => void;
  removeNode: (id: string) => void;
  setUnassignedMembers: (members: UnassignedMember[]) => void;
  addUnassignedMember: (member: UnassignedMember) => void;
  removeUnassignedMember: (id: string) => void;
  setHistory: (history: HistoryEntry[]) => void;
  addHistoryEntry: (entry: HistoryEntry) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentMap: null,
  nodes: [],
  unassignedMembers: [],
  history: [],
  selectedNodeId: null,
  isLoading: false,
  isSaving: false,
};

export const useMapStore = create<MapState>((set) => ({
  ...initialState,

  setCurrentMap: (map) => set({ currentMap: map }),

  setNodes: (nodes) => set({ nodes }),

  addNode: (node) =>
    set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
    })),

  setUnassignedMembers: (members) => set({ unassignedMembers: members }),

  addUnassignedMember: (member) =>
    set((state) => ({
      unassignedMembers: [...state.unassignedMembers, member],
    })),

  removeUnassignedMember: (id) =>
    set((state) => ({
      unassignedMembers: state.unassignedMembers.filter((m) => m.id !== id),
    })),

  setHistory: (history) => set({ history }),

  addHistoryEntry: (entry) =>
    set((state) => ({ history: [entry, ...state.history] })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  reset: () => set(initialState),
}));
