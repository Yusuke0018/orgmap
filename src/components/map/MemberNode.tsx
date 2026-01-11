'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';
import type { OrgNode } from '@/types';

interface MemberNodeData {
  label: string;
  nodeData: OrgNode;
  onEditRole?: (id: string, role: string) => void;
}

function MemberNodeComponent({
  data,
  selected,
}: NodeProps & { data: MemberNodeData }) {
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editRole, setEditRole] = useState(data.nodeData.role || '');

  const handleRoleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingRole(true);
    setEditRole(data.nodeData.role || '');
  };

  const handleRoleBlur = () => {
    if (editRole !== data.nodeData.role) {
      data.onEditRole?.(data.nodeData.id, editRole.trim());
    }
    setIsEditingRole(false);
  };

  const handleRoleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRoleBlur();
    } else if (e.key === 'Escape') {
      setEditRole(data.nodeData.role || '');
      setIsEditingRole(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 px-3 py-2 shadow-sm min-w-[120px] transition-all ${
        selected
          ? 'border-[var(--primary)] shadow-md'
          : 'border-[var(--border)] hover:border-gray-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-[var(--primary)] border-2 border-white"
      />

      <div className="flex items-center gap-2">
        {/* Avatar */}
        {data.nodeData.iconUrl ? (
          <img
            src={data.nodeData.iconUrl}
            alt={data.label}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        )}

        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {data.label}
          </span>

          {isEditingRole ? (
            <input
              type="text"
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              onBlur={handleRoleBlur}
              onKeyDown={handleRoleKeyDown}
              className="text-xs bg-transparent border-b border-[var(--primary)] outline-none text-[var(--text-secondary)] w-full"
              placeholder="役職を入力"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]"
              onDoubleClick={handleRoleDoubleClick}
            >
              {data.nodeData.role || '役職なし'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export const MemberNode = memo(MemberNodeComponent);
