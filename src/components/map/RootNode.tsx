'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Building2 } from 'lucide-react';

interface RootNodeData {
  label: string;
}

function RootNodeComponent({ data }: NodeProps & { data: RootNodeData }) {
  return (
    <div className="bg-[var(--primary)] text-white rounded-xl px-6 py-4 shadow-lg min-w-[150px]">
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6" />
        <span className="text-lg font-bold">{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-white border-2 border-[var(--primary)]"
      />
    </div>
  );
}

export const RootNode = memo(RootNodeComponent);
