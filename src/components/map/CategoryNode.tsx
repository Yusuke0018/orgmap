'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import type { OrgNode } from '@/types';

interface CategoryNodeData {
  label: string;
  nodeData: OrgNode;
  childCount?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onEdit?: (id: string, name: string) => void;
}

function CategoryNodeComponent({
  data,
  selected,
}: NodeProps & { data: CategoryNodeData }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.label);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditName(data.label);
  };

  const handleBlur = () => {
    if (editName.trim() && editName !== data.label) {
      data.onEdit?.(data.nodeData.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditName(data.label);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 px-4 py-3 shadow-sm min-w-[140px] transition-all ${
        selected
          ? 'border-[var(--primary)] shadow-md'
          : 'border-[var(--border)] hover:border-gray-400'
      }`}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-[var(--primary)] border-2 border-white"
      />

      <div className="flex items-center gap-2">
        {data.childCount !== undefined && data.childCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onToggleCollapse?.();
            }}
            className="p-0.5 hover:bg-gray-100 rounded"
          >
            {data.isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>
        )}

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-b border-[var(--primary)] outline-none font-semibold text-[var(--text-primary)] w-full"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="font-semibold text-[var(--text-primary)]">
            {data.label}
          </span>
        )}
      </div>

      {data.isCollapsed && data.childCount !== undefined && data.childCount > 0 && (
        <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-secondary)]">
          <Users className="w-3 h-3" />
          <span>{data.childCount}人</span>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-[var(--primary)] border-2 border-white"
      />
    </div>
  );
}

export const CategoryNode = memo(CategoryNodeComponent);
