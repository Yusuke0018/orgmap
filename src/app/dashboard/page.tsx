'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Settings, ChevronDown, MessageSquare } from 'lucide-react';
import { MapCard, CreateMapCard, CreateMapModal, ChatworkSettingsModal } from '@/components/dashboard';
import { ConfirmDialog, toast } from '@/components/common';
import { useUserStore } from '@/stores/userStore';
import {
  subscribeToMaps,
  createMap,
  deleteMap,
  duplicateMap,
  updateMap,
} from '@/lib/firestore';
import type { OrgMap } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { userId, nickname, isAuthenticated } = useUserStore();
  const [maps, setMaps] = useState<OrgMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showChatworkSettings, setShowChatworkSettings] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
      return;
    }

    // Subscribe to maps with real-time updates
    setIsLoading(true);
    const unsubscribe = subscribeToMaps((updatedMaps) => {
      setMaps(updatedMaps);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated, router]);

  const handleCreateMap = async (name: string) => {
    if (!userId) return;

    setIsCreating(true);
    try {
      const mapId = await createMap({ name, createdBy: userId });
      setShowCreateModal(false);
      toast.success(`「${name}」を作成しました`);
      router.push(`/map/${mapId}`);
    } catch (error) {
      console.error('Error creating map:', error);
      toast.error('マップの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMap = async () => {
    if (!selectedMapId) return;

    try {
      await deleteMap(selectedMapId);
      toast.success('マップを削除しました');
    } catch (error) {
      console.error('Error deleting map:', error);
      toast.error('マップの削除に失敗しました');
    } finally {
      setSelectedMapId(null);
    }
  };

  const handleDuplicateMap = async (id: string) => {
    const original = maps.find((m) => m.id === id);
    if (!original) return;

    try {
      await duplicateMap(id, `${original.name} (コピー)`);
      toast.success(`「${original.name} (コピー)」を作成しました`);
    } catch (error) {
      console.error('Error duplicating map:', error);
      toast.error('マップの複製に失敗しました');
    }
  };

  const handleRenameMap = async (id: string, newName: string) => {
    try {
      await updateMap(id, { name: newName });
      toast.success('名前を変更しました');
    } catch (error) {
      console.error('Error renaming map:', error);
      toast.error('名前の変更に失敗しました');
    }
  };

  const selectedMap = maps.find((m) => m.id === selectedMapId);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="bg-white border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[var(--primary)]" />
            <span className="text-lg font-bold text-[var(--text-primary)]">
              組織図エディタ
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowChatworkSettings(true)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100 rounded-lg transition-colors"
              title="Chatwork連携設定"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium">
                  {nickname?.charAt(0) || '?'}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {nickname}
                </span>
                <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-20 w-48">
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      onClick={() => {
                        setShowUserMenu(false);
                      }}
                    >
                      設定
                    </button>
                    <hr className="my-1 border-[var(--border)]" />
                    <button
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-[var(--danger)]"
                      onClick={async () => {
                        await useUserStore.getState().logout();
                        router.push('/');
                      }}
                    >
                      ログアウト
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          マップ一覧
        </h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[var(--border)] p-4 animate-pulse"
              >
                <div className="h-24 flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {maps.map((map) => (
              <MapCard
                key={map.id}
                map={map}
                onDelete={(id) => {
                  setSelectedMapId(id);
                  setShowDeleteDialog(true);
                }}
                onDuplicate={handleDuplicateMap}
                onRename={handleRenameMap}
              />
            ))}
            <CreateMapCard onClick={() => setShowCreateModal(true)} />
          </div>
        )}
      </main>

      {/* Create Map Modal */}
      <CreateMapModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateMap}
        isLoading={isCreating}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedMapId(null);
        }}
        onConfirm={handleDeleteMap}
        title={`「${selectedMap?.name}」を削除しますか？`}
        message={`この操作は取り消せません。\n${selectedMap?.memberCount || 0}人のメンバー情報も削除されます。`}
        confirmText="削除"
        variant="danger"
      />

      {/* Chatwork Settings Modal */}
      <ChatworkSettingsModal
        isOpen={showChatworkSettings}
        onClose={() => setShowChatworkSettings(false)}
      />
    </div>
  );
}
