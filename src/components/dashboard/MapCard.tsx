'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, MoreVertical, Edit2, Copy, Trash2 } from 'lucide-react';
import { formatShortDate, cn } from '@/lib/utils';
import type { OrgMap } from '@/types';

interface MapCardProps {
  map: OrgMap;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

export function MapCard({ map, onDelete, onDuplicate, onRename }: MapCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(map.name);

  const handleClick = () => {
    if (!isEditing && !showMenu) {
      router.push(`/map/${map.id}`);
    }
  };

  const handleRename = () => {
    if (editName.trim() && editName !== map.name) {
      onRename?.(map.id, editName.trim());
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditName(map.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl border border-[var(--border)] p-4 cursor-pointer hover:shadow-md hover:border-[var(--primary)] transition-all group relative"
      onClick={handleClick}
    >
      {/* Menu Button */}
      <div className="absolute top-3 right-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-[var(--border)] py-1 z-20 w-36">
              <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setShowMenu(false);
                }}
              >
                <Edit2 className="w-4 h-4" />
                名前を変更
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate?.(map.id);
                  setShowMenu(false);
                }}
              >
                <Copy className="w-4 h-4" />
                複製
              </button>
              <hr className="my-1 border-[var(--border)]" />
              <button
                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 text-[var(--danger)]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(map.id);
                  setShowMenu(false);
                }}
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
            </div>
          </>
        )}
      </div>

      {/* Card Content */}
      <div className="h-24 flex items-center justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)] to-blue-400 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">
            {map.name.charAt(0)}
          </span>
        </div>
      </div>

      {/* Name */}
      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="w-full text-center text-lg font-semibold bg-transparent border-b-2 border-[var(--primary)] outline-none"
          autoFocus
        />
      ) : (
        <h3 className="text-center text-lg font-semibold text-[var(--text-primary)] truncate">
          {map.name}
        </h3>
      )}

      {/* Info */}
      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-[var(--text-secondary)]">
        <Users className="w-4 h-4" />
        <span>{map.memberCount || 0}人</span>
      </div>

      <p className="text-center text-xs text-[var(--text-secondary)] mt-2">
        更新: {formatShortDate(map.updatedAt)}
      </p>
    </div>
  );
}

// Create New Map Card
export function CreateMapCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border-2 border-dashed border-[var(--border)] p-4 cursor-pointer hover:border-[var(--primary)] hover:bg-blue-50 transition-all min-h-[200px] flex flex-col items-center justify-center gap-2"
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-2xl text-[var(--text-secondary)]">+</span>
      </div>
      <span className="text-[var(--text-secondary)] font-medium">
        新規作成
      </span>
    </button>
  );
}
