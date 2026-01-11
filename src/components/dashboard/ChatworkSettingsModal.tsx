'use client';

import { useState } from 'react';
import { Key, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Modal, Button, Input, toast } from '@/components/common';
import { useUserStore } from '@/stores/userStore';

interface ChatworkSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatworkSettingsModal({
  isOpen,
  onClose,
}: ChatworkSettingsModalProps) {
  const { chatworkToken, chatworkTokenValid, setChatworkToken } = useUserStore();
  const [token, setToken] = useState(chatworkToken || '');
  const [isValidating, setIsValidating] = useState(false);

  const handleSave = async () => {
    if (!token.trim()) {
      await setChatworkToken(null);
      toast.success('Chatwork連携を解除しました');
      onClose();
      return;
    }

    setIsValidating(true);
    try {
      await setChatworkToken(token.trim());
      if (useUserStore.getState().chatworkTokenValid) {
        toast.success('Chatwork APIトークンを保存しました');
        onClose();
      } else {
        toast.error('無効なAPIトークンです');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      toast.error('トークンの検証に失敗しました');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = async () => {
    await setChatworkToken(null);
    setToken('');
    toast.success('Chatwork連携を解除しました');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chatwork連携設定" size="md">
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-[var(--text-primary)] mb-2">
            APIトークンの取得方法
          </h4>
          <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
            <li>Chatworkにログイン</li>
            <li>右上のアイコン → 「サービス連携」をクリック</li>
            <li>「APIトークン」タブを選択</li>
            <li>パスワードを入力してトークンを表示</li>
          </ol>
          <a
            href="https://www.chatwork.com/service/packages/chatwork/subpackages/api/token.php"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline mt-2"
          >
            APIトークン取得ページを開く
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            APIトークン
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="APIトークンを入力"
              className="w-full pl-10 pr-10 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
            />
            {chatworkToken && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {chatworkTokenValid ? (
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[var(--danger)]" />
                )}
              </span>
            )}
          </div>
          {chatworkToken && (
            <p
              className={`text-xs mt-1 ${chatworkTokenValid ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}
            >
              {chatworkTokenValid ? '有効なトークンです' : '無効なトークンです'}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          {chatworkToken && (
            <Button variant="danger" onClick={handleRemove} className="flex-1">
              連携解除
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} className="flex-1">
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1"
            disabled={isValidating}
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                検証中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
