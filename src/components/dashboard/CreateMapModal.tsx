'use client';

import { useState } from 'react';
import { Modal, Input, Button } from '@/components/common';

interface CreateMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading?: boolean;
}

export function CreateMapModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateMapModalProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    setName('');
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="新しいマップを作成" size="sm">
      <form onSubmit={handleSubmit}>
        <Input
          label="マップ名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 大阪院"
          autoFocus
        />

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-[var(--text-secondary)]">
            💡 Chatwork連携でメンバーを自動取得する場合は、
            マップ作成後に設定画面からAPIトークンを登録してください。
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            className="flex-1"
            isLoading={isLoading}
            disabled={!name.trim()}
          >
            作成する
          </Button>
        </div>
      </form>
    </Modal>
  );
}
