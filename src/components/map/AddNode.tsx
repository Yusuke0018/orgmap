'use client';

import { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus } from 'lucide-react';

interface AddNodeData {
  parentId: string;
  onAdd?: (parentId: string, name: string) => void;
}

function AddNodeComponent({ data }: NodeProps & { data: AddNodeData }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');

  const handleClick = () => {
    setIsAdding(true);
  };

  const handleSubmit = () => {
    if (name.trim()) {
      data.onAdd?.(data.parentId, name.trim());
      setName('');
    }
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setName('');
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="bg-white rounded-lg border-2 border-dashed border-[var(--primary)] px-3 py-2">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-[var(--primary)] border-2 border-white"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          placeholder="カテゴリ名を入力"
          className="text-sm outline-none w-28"
          autoFocus
        />
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="bg-white rounded-lg border-2 border-dashed border-[var(--border)] px-3 py-2 hover:border-[var(--primary)] hover:bg-blue-50 transition-all flex items-center gap-1 text-[var(--text-secondary)]"
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-300 border-2 border-white"
      />
      <Plus className="w-4 h-4" />
      <span className="text-sm">追加</span>
    </button>
  );
}

export const AddNode = memo(AddNodeComponent);
