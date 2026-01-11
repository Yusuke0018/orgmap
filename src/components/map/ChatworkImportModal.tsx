'use client';

import { useState, useEffect } from 'react';
import { Users, Check, Loader2, AlertCircle, Settings } from 'lucide-react';
import { Modal, Button, toast } from '@/components/common';
import { useUserStore } from '@/stores/userStore';
import { getChatworkMembers, type ChatworkMember } from '@/lib/chatwork';
import { addUnassignedMember, addHistoryEntry } from '@/lib/firestore';

interface ChatworkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapId: string;
  onOpenSettings: () => void;
}

export function ChatworkImportModal({
  isOpen,
  onClose,
  mapId,
  onOpenSettings,
}: ChatworkImportModalProps) {
  const { chatworkToken, chatworkTokenValid, userId, nickname } = useUserStore();
  const [members, setMembers] = useState<ChatworkMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load members when modal opens
  useEffect(() => {
    if (isOpen && chatworkToken && chatworkTokenValid) {
      loadMembers();
    }
  }, [isOpen, chatworkToken, chatworkTokenValid]);

  const loadMembers = async () => {
    if (!chatworkToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const contacts = await getChatworkMembers(chatworkToken);
      setMembers(contacts);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('メンバーの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMember = (accountId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.account_id)));
    }
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) {
      toast.error('インポートするメンバーを選択してください');
      return;
    }

    setIsImporting(true);
    try {
      const selectedMembers = members.filter((m) =>
        selectedIds.has(m.account_id)
      );

      for (const member of selectedMembers) {
        await addUnassignedMember(mapId, {
          name: member.name,
          iconUrl: member.avatar_image_url,
          chatworkAccountId: member.account_id.toString(),
        });
      }

      await addHistoryEntry(mapId, {
        userId: userId || 'anonymous',
        userName: nickname || '匿名',
        action: 'add',
        targetType: 'member',
        targetName: `${selectedMembers.length}名`,
        detail: `Chatworkから${selectedMembers.length}名のメンバーをインポート`,
      });

      toast.success(`${selectedMembers.length}名をインポートしました`);
      setSelectedIds(new Set());
      onClose();
    } catch (error) {
      console.error('Error importing members:', error);
      toast.error('インポートに失敗しました');
    } finally {
      setIsImporting(false);
    }
  };

  // Show settings prompt if not configured
  if (!chatworkToken || !chatworkTokenValid) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Chatworkからインポート" size="sm">
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-[var(--text-secondary)]" />
          </div>
          <h3 className="font-medium text-[var(--text-primary)] mb-2">
            Chatwork連携が必要です
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            メンバーをインポートするには、
            <br />
            まずChatwork APIトークンを設定してください
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              キャンセル
            </Button>
            <Button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="flex-1"
            >
              設定を開く
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chatworkからインポート" size="md">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">{error}</p>
            <Button variant="secondary" onClick={loadMembers} className="mt-4">
              再読み込み
            </Button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">
              コンタクトが見つかりません
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--text-secondary)]">
                {members.length}人のコンタクト
              </p>
              <button
                onClick={toggleAll}
                className="text-sm text-[var(--primary)] hover:underline"
              >
                {selectedIds.size === members.length
                  ? 'すべて解除'
                  : 'すべて選択'}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
              {members.map((member) => (
                <label
                  key={member.account_id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(member.account_id)}
                    onChange={() => toggleMember(member.account_id)}
                    className="w-4 h-4 rounded border-gray-300 text-[var(--primary)] focus:ring-[var(--primary)]"
                  />
                  {member.avatar_image_url ? (
                    <img
                      src={member.avatar_image_url}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-medium">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {member.name}
                    </p>
                    {member.department && (
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {member.department}
                      </p>
                    )}
                  </div>
                  {selectedIds.has(member.account_id) && (
                    <Check className="w-5 h-5 text-[var(--primary)]" />
                  )}
                </label>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            キャンセル
          </Button>
          <Button
            onClick={handleImport}
            className="flex-1"
            disabled={selectedIds.size === 0 || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                インポート中...
              </>
            ) : (
              <>
                {selectedIds.size > 0 && `${selectedIds.size}名を`}
                インポート
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
