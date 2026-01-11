// User type
export interface User {
  id: string;
  nickname: string;
  chatworkToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Map type
export interface OrgMap {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
}

// Node types
export type NodeType = 'category' | 'member';

export interface OrgNode {
  id: string;
  type: NodeType;
  name: string;
  parentId: string | null;
  order: number;
  role?: string;
  iconUrl?: string;
  chatworkAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryNode extends OrgNode {
  type: 'category';
  isCollapsed?: boolean;
}

export interface MemberNode extends OrgNode {
  type: 'member';
  role?: string;
  iconUrl?: string;
  chatworkAccountId?: string;
}

// Unassigned member
export interface UnassignedMember {
  id: string;
  name: string;
  iconUrl?: string;
  chatworkAccountId?: string;
  createdAt: Date;
}

// History types
export type HistoryAction = 'add' | 'remove' | 'move' | 'rename';

export interface HistoryEntry {
  id: string;
  userId: string;
  userName: string;
  action: HistoryAction;
  targetType: NodeType;
  targetName: string;
  detail: string;
  timestamp: Date;
  previousState?: Record<string, unknown>;
}

// Chatwork types
export interface ChatworkRoom {
  roomId: number;
  name: string;
  memberCount: number;
  iconPath?: string;
}

export interface ChatworkMember {
  accountId: number;
  name: string;
  avatarImageUrl?: string;
}

// React Flow node types
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeData: OrgNode;
    isRoot?: boolean;
    childCount?: number;
    isCollapsed?: boolean;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

// Form types
export interface CreateMapForm {
  name: string;
  chatworkRoomId?: number;
}

export interface AddMemberForm {
  name: string;
  role?: string;
}
