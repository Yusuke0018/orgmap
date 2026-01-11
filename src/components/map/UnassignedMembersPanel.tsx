'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, Search, User } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import type { UnassignedMember } from '@/types';

interface UnassignedMembersPanelProps {
  members: UnassignedMember[];
  onDragStart?: (member: UnassignedMember) => void;
}

export function UnassignedMembersPanel({
  members,
}: UnassignedMembersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (members.length === 0) {
    return (
      <div className="bg-white border-t border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-[var(--success)]">
          <span className="text-sm font-medium">全員配置済み ✓</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-[var(--border)]">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
          <span className="font-medium text-[var(--text-primary)]">
            未配置メンバー
          </span>
          <span className="text-sm text-[var(--text-secondary)]">
            ({members.length}人)
          </span>
        </div>

        {isExpanded && (
          <div
            className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Search className="w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm outline-none w-24"
            />
          </div>
        )}
      </button>

      {/* Members List */}
      {isExpanded && (
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {filteredMembers.map((member) => (
              <DraggableMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface DraggableMemberCardProps {
  member: UnassignedMember;
}

function DraggableMemberCard({ member }: DraggableMemberCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: member.id,
    data: { member },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-lg cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:bg-gray-100'
      }`}
    >
      {member.iconUrl ? (
        <img
          src={member.iconUrl}
          alt={member.name}
          className="w-10 h-10 rounded-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
      <span className="text-sm text-[var(--text-primary)] whitespace-nowrap">
        {member.name}
      </span>
    </div>
  );
}
