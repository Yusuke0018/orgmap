import { v4 as uuidv4 } from 'uuid';
import type { OrgNode, FlowNode, FlowEdge } from '@/types';

export function generateId(): string {
  return uuidv4();
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return `今日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else if (days === 1) {
    return `昨日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  } else if (days < 7) {
    return `${days}日前`;
  } else {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

export function formatShortDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// Build tree structure from flat nodes
export interface TreeNode extends OrgNode {
  children: TreeNode[];
}

export function buildTree(nodes: OrgNode[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // First pass: create TreeNode objects
  nodes.forEach((node) => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Second pass: build parent-child relationships
  nodes.forEach((node) => {
    const treeNode = nodeMap.get(node.id)!;
    if (node.parentId === null) {
      roots.push(treeNode);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(treeNode);
      }
    }
  });

  // Sort children by order
  const sortChildren = (node: TreeNode) => {
    node.children.sort((a, b) => a.order - b.order);
    node.children.forEach(sortChildren);
  };

  roots.sort((a, b) => a.order - b.order);
  roots.forEach(sortChildren);

  return roots;
}

// Convert tree structure to React Flow nodes and edges
export function treeToFlowElements(
  tree: TreeNode[],
  mapName: string,
  collapsedNodes: Set<string> = new Set()
): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const flowNodes: FlowNode[] = [];
  const flowEdges: FlowEdge[] = [];

  const HORIZONTAL_SPACING = 250;
  const VERTICAL_SPACING = 80;
  const ROOT_X = 50;
  const ROOT_Y = 50;

  // Create root node for the map
  const rootId = 'root';
  flowNodes.push({
    id: rootId,
    type: 'rootNode',
    position: { x: ROOT_X, y: ROOT_Y },
    data: {
      label: mapName,
      nodeData: {
        id: rootId,
        type: 'category',
        name: mapName,
        parentId: null,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      isRoot: true,
    },
  });

  let globalY = ROOT_Y;

  const processNode = (
    node: TreeNode,
    depth: number,
    parentId: string
  ): number => {
    const x = ROOT_X + (depth + 1) * HORIZONTAL_SPACING;
    const y = globalY;

    const isCollapsed = collapsedNodes.has(node.id);
    const childCount = countDescendants(node);

    flowNodes.push({
      id: node.id,
      type: node.type === 'member' ? 'memberNode' : 'categoryNode',
      position: { x, y },
      data: {
        label: node.name,
        nodeData: node,
        childCount,
        isCollapsed,
      },
    });

    flowEdges.push({
      id: `e-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      type: 'smoothstep',
    });

    globalY += VERTICAL_SPACING;

    if (!isCollapsed && node.children.length > 0) {
      node.children.forEach((child) => {
        processNode(child, depth + 1, node.id);
      });
    }

    return y;
  };

  tree.forEach((rootChild) => {
    processNode(rootChild, 0, rootId);
  });

  return { nodes: flowNodes, edges: flowEdges };
}

function countDescendants(node: TreeNode): number {
  let count = node.type === 'member' ? 1 : 0;
  node.children.forEach((child) => {
    count += countDescendants(child);
  });
  return count;
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Generate share URL
export function getShareUrl(mapId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/map/${mapId}`;
}

// Class name utility
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
