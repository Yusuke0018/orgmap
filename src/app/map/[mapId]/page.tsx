'use client';

import { useState, useCallback, useMemo, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  ArrowLeft,
  UserPlus,
  History,
  Share2,
  Check,
  User,
  Loader2,
} from 'lucide-react';
import { Button, toast, Modal, Input } from '@/components/common';
import {
  RootNode,
  CategoryNode,
  MemberNode,
  AddNode,
  UnassignedMembersPanel,
} from '@/components/map';
import { useUserStore } from '@/stores/userStore';
import { copyToClipboard, getShareUrl } from '@/lib/utils';
import {
  getMap,
  updateMap,
  subscribeToNodes,
  subscribeToUnassignedMembers,
  addNode,
  updateNode,
  deleteNode,
  addUnassignedMember,
  deleteUnassignedMember,
  getHistory,
  addHistoryEntry,
} from '@/lib/firestore';
import type { OrgNode, UnassignedMember, OrgMap, HistoryEntry } from '@/types';

// Node types for React Flow
const nodeTypes = {
  rootNode: RootNode,
  categoryNode: CategoryNode,
  memberNode: MemberNode,
  addNode: AddNode,
};

// Build flow elements from org nodes
function buildFlowElements(
  mapName: string,
  orgNodes: OrgNode[],
  callbacks: {
    onToggleCollapse: (id: string) => void;
    onEditCategory: (id: string, name: string) => void;
    onEditRole: (id: string, role: string) => void;
    onAddCategory: (parentId: string, name: string) => void;
  },
  collapsedNodes: Set<string>
): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];

  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 70;
  const ROOT_X = 50;
  const ROOT_Y = 200;

  // Root node
  flowNodes.push({
    id: 'root',
    type: 'rootNode',
    position: { x: ROOT_X, y: ROOT_Y },
    data: { label: mapName },
    draggable: false,
  });

  // Get categories (nodes with null parentId)
  const categories = orgNodes
    .filter((n) => n.parentId === null && n.type === 'category')
    .sort((a, b) => a.order - b.order);

  let categoryY = ROOT_Y - ((categories.length - 1) * VERTICAL_SPACING) / 2;

  categories.forEach((category) => {
    const members = orgNodes
      .filter((n) => n.parentId === category.id)
      .sort((a, b) => a.order - b.order);

    const isCollapsed = collapsedNodes.has(category.id);

    flowNodes.push({
      id: category.id,
      type: 'categoryNode',
      position: { x: ROOT_X + HORIZONTAL_SPACING, y: categoryY },
      data: {
        label: category.name,
        nodeData: category,
        childCount: members.length,
        isCollapsed,
        onToggleCollapse: () => callbacks.onToggleCollapse(category.id),
        onEdit: callbacks.onEditCategory,
      },
    });

    flowEdges.push({
      id: `e-root-${category.id}`,
      source: 'root',
      target: category.id,
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    });

    if (!isCollapsed) {
      let memberY = categoryY - ((members.length - 1) * 60) / 2;

      members.forEach((member) => {
        flowNodes.push({
          id: member.id,
          type: 'memberNode',
          position: { x: ROOT_X + HORIZONTAL_SPACING * 2, y: memberY },
          data: {
            label: member.name,
            nodeData: member,
            onEditRole: callbacks.onEditRole,
          },
        });

        flowEdges.push({
          id: `e-${category.id}-${member.id}`,
          source: category.id,
          target: member.id,
          type: 'smoothstep',
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        });

        memberY += 60;
      });
    }

    categoryY += VERTICAL_SPACING + (isCollapsed ? 0 : members.length * 30);
  });

  // Add node at the end
  flowNodes.push({
    id: 'add-category',
    type: 'addNode',
    position: {
      x: ROOT_X + HORIZONTAL_SPACING,
      y: categoryY + 20,
    },
    data: {
      parentId: 'root',
      onAdd: callbacks.onAddCategory,
    },
    draggable: false,
  });

  flowEdges.push({
    id: 'e-root-add',
    source: 'root',
    target: 'add-category',
    type: 'smoothstep',
    style: { stroke: '#d1d5db', strokeWidth: 2, strokeDasharray: '5,5' },
  });

  return { nodes: flowNodes, edges: flowEdges };
}

export default function MapEditorPage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { mapId } = use(params);
  const router = useRouter();
  const { userId, nickname } = useUserStore();

  // State
  const [map, setMap] = useState<OrgMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [orgNodes, setOrgNodes] = useState<OrgNode[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<UnassignedMember[]>([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isSaved, setIsSaved] = useState(true);
  const [draggedMember, setDraggedMember] = useState<UnassignedMember | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  // Load map and subscribe to updates
  useEffect(() => {
    const loadMap = async () => {
      try {
        const mapData = await getMap(mapId);
        if (!mapData) {
          toast.error('マップが見つかりません');
          router.push('/dashboard');
          return;
        }
        setMap(mapData);
      } catch (error) {
        console.error('Error loading map:', error);
        toast.error('マップの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();

    // Subscribe to nodes
    const unsubNodes = subscribeToNodes(mapId, (nodes) => {
      setOrgNodes(nodes);
      setIsSaved(true);
    });

    // Subscribe to unassigned members
    const unsubMembers = subscribeToUnassignedMembers(mapId, (members) => {
      setUnassignedMembers(members);
    });

    return () => {
      unsubNodes();
      unsubMembers();
    };
  }, [mapId, router]);

  // Load history when panel opens
  useEffect(() => {
    if (showHistoryPanel) {
      getHistory(mapId).then(setHistory).catch(console.error);
    }
  }, [showHistoryPanel, mapId]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Callbacks
  const handleToggleCollapse = useCallback((id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleEditCategory = useCallback(
    async (id: string, name: string) => {
      try {
        await updateNode(mapId, id, { name });
        await addHistoryEntry(mapId, {
          userId: userId || 'anonymous',
          userName: nickname || '匿名',
          action: 'rename',
          targetType: 'category',
          targetName: name,
          detail: `カテゴリ名を「${name}」に変更`,
        });
        toast.success('カテゴリ名を更新しました');
      } catch (error) {
        console.error('Error updating category:', error);
        toast.error('更新に失敗しました');
      }
    },
    [mapId, userId, nickname]
  );

  const handleEditRole = useCallback(
    async (id: string, role: string) => {
      try {
        const node = orgNodes.find((n) => n.id === id);
        await updateNode(mapId, id, { role });
        await addHistoryEntry(mapId, {
          userId: userId || 'anonymous',
          userName: nickname || '匿名',
          action: 'rename',
          targetType: 'member',
          targetName: node?.name || '',
          detail: `役職を「${role}」に変更`,
        });
        toast.success('役職を更新しました');
      } catch (error) {
        console.error('Error updating role:', error);
        toast.error('更新に失敗しました');
      }
    },
    [mapId, orgNodes, userId, nickname]
  );

  const handleAddCategory = useCallback(
    async (parentId: string, name: string) => {
      try {
        const order = orgNodes.filter((n) => n.parentId === null).length;
        await addNode(mapId, {
          type: 'category',
          name,
          parentId: null,
          order,
        });
        await addHistoryEntry(mapId, {
          userId: userId || 'anonymous',
          userName: nickname || '匿名',
          action: 'add',
          targetType: 'category',
          targetName: name,
          detail: `カテゴリ「${name}」を追加`,
        });
        toast.success(`「${name}」を追加しました`);
      } catch (error) {
        console.error('Error adding category:', error);
        toast.error('追加に失敗しました');
      }
    },
    [mapId, orgNodes, userId, nickname]
  );

  const handleAddMember = useCallback(async () => {
    if (!newMemberName.trim()) return;

    try {
      await addUnassignedMember(mapId, { name: newMemberName.trim() });
      await addHistoryEntry(mapId, {
        userId: userId || 'anonymous',
        userName: nickname || '匿名',
        action: 'add',
        targetType: 'member',
        targetName: newMemberName.trim(),
        detail: `メンバー「${newMemberName.trim()}」を追加`,
      });
      toast.success(`「${newMemberName.trim()}」を追加しました`);
      setNewMemberName('');
      setNewMemberRole('');
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('追加に失敗しました');
    }
  }, [mapId, newMemberName, userId, nickname]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      const member = unassignedMembers.find((m) => m.id === active.id);
      if (!member) return;

      const targetId = over.id.toString();
      const targetCategory = orgNodes.find(
        (n) => n.id === targetId && n.type === 'category'
      );

      if (targetCategory) {
        try {
          const order = orgNodes.filter((n) => n.parentId === targetCategory.id).length;
          await addNode(mapId, {
            type: 'member',
            name: member.name,
            role: '',
            iconUrl: member.iconUrl,
            chatworkAccountId: member.chatworkAccountId,
            parentId: targetCategory.id,
            order,
          });
          await deleteUnassignedMember(mapId, member.id);
          await addHistoryEntry(mapId, {
            userId: userId || 'anonymous',
            userName: nickname || '匿名',
            action: 'move',
            targetType: 'member',
            targetName: member.name,
            detail: `「${member.name}」を「${targetCategory.name}」に配置`,
          });
          toast.success(`「${member.name}」を「${targetCategory.name}」に配置しました`);
        } catch (error) {
          console.error('Error placing member:', error);
          toast.error('配置に失敗しました');
        }
      }

      setDraggedMember(null);
    },
    [mapId, orgNodes, unassignedMembers, userId, nickname]
  );

  const handleShare = async () => {
    const url = getShareUrl(mapId);
    const success = await copyToClipboard(url);
    if (success) {
      toast.success('URLをコピーしました');
    } else {
      toast.error('コピーに失敗しました');
    }
  };

  const handleNameChange = async (newName: string) => {
    if (newName.trim() && newName !== map?.name) {
      try {
        await updateMap(mapId, { name: newName.trim() });
        setMap((prev) => (prev ? { ...prev, name: newName.trim() } : prev));
        toast.success('マップ名を更新しました');
      } catch (error) {
        console.error('Error updating map name:', error);
        toast.error('更新に失敗しました');
      }
    }
    setIsEditingName(false);
  };

  // Build React Flow elements
  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () =>
      buildFlowElements(
        map?.name || 'マップ',
        orgNodes,
        {
          onToggleCollapse: handleToggleCollapse,
          onEditCategory: handleEditCategory,
          onEditRole: handleEditRole,
          onAddCategory: handleAddCategory,
        },
        collapsedNodes
      ),
    [
      map?.name,
      orgNodes,
      collapsedNodes,
      handleToggleCollapse,
      handleEditCategory,
      handleEditRole,
      handleAddCategory,
    ]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges]
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const member = unassignedMembers.find((m) => m.id === event.active.id);
        if (member) setDraggedMember(member);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-[var(--background)]">
        {/* Header */}
        <header className="bg-white border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            {isEditingName ? (
              <input
                type="text"
                defaultValue={map?.name}
                onBlur={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameChange(e.currentTarget.value);
                  else if (e.key === 'Escape') setIsEditingName(false);
                }}
                className="text-lg font-bold border-b-2 border-[var(--primary)] outline-none bg-transparent"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg font-bold text-[var(--text-primary)] cursor-pointer hover:text-[var(--primary)]"
                onClick={() => setIsEditingName(true)}
              >
                {map?.name}
              </h1>
            )}

            {isSaved && (
              <span className="flex items-center gap-1 text-xs text-[var(--success)]">
                <Check className="w-3 h-3" />
                保存済み
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => setShowAddMemberModal(true)}
            >
              追加
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<History className="w-4 h-4" />}
              onClick={() => setShowHistoryPanel(true)}
            >
              履歴
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Share2 className="w-4 h-4" />}
              onClick={handleShare}
            >
              共有
            </Button>
          </div>
        </header>

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            defaultEdgeOptions={{
              type: 'smoothstep',
              style: { stroke: '#94a3b8', strokeWidth: 2 },
            }}
          >
            <Controls position="bottom-right" />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          </ReactFlow>
        </div>

        {/* Unassigned Members Panel */}
        <UnassignedMembersPanel members={unassignedMembers} />

        {/* Add Member Modal */}
        <Modal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          title="メンバーを追加"
          size="sm"
        >
          <div className="space-y-4">
            <Input
              label="名前"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="例: 山田太郎"
              autoFocus
            />
            <Input
              label="役職（任意）"
              value={newMemberRole}
              onChange={(e) => setNewMemberRole(e.target.value)}
              placeholder="例: 看護師"
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleAddMember}
                className="flex-1"
                disabled={!newMemberName.trim()}
              >
                追加
              </Button>
            </div>
          </div>
        </Modal>

        {/* History Panel */}
        {showHistoryPanel && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowHistoryPanel(false)}
            />
            <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 animate-slide-in">
              <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="font-semibold text-[var(--text-primary)]">
                  編集履歴
                </h2>
                <button
                  onClick={() => setShowHistoryPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-y-auto h-[calc(100%-60px)]">
                {history.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-sm text-center py-8">
                    履歴はまだありません
                  </p>
                ) : (
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-gray-50 rounded-lg text-sm"
                      >
                        <p className="text-[var(--text-primary)]">
                          {entry.detail}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {entry.userName} ・{' '}
                          {entry.timestamp.toLocaleString('ja-JP', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedMember && (
            <div className="flex flex-col items-center gap-1 p-3 bg-white rounded-lg shadow-lg border-2 border-[var(--primary)]">
              {draggedMember.iconUrl ? (
                <img
                  src={draggedMember.iconUrl}
                  alt={draggedMember.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {draggedMember.name}
              </span>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
