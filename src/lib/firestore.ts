import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { OrgMap, OrgNode, UnassignedMember, HistoryEntry } from '@/types';

// Helper to convert Firestore timestamp to Date
function toDate(timestamp: Timestamp | Date | undefined): Date {
  if (!timestamp) return new Date();
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
}

// ============ MAPS ============

export async function getMaps(): Promise<OrgMap[]> {
  const mapsRef = collection(db, 'maps');
  const q = query(mapsRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    updatedAt: toDate(doc.data().updatedAt),
  })) as OrgMap[];
}

export async function getMap(mapId: string): Promise<OrgMap | null> {
  const docRef = doc(db, 'maps', mapId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: toDate(snapshot.data().createdAt),
    updatedAt: toDate(snapshot.data().updatedAt),
  } as OrgMap;
}

export async function createMap(data: { name: string; createdBy: string }): Promise<string> {
  const mapsRef = collection(db, 'maps');
  const docRef = await addDoc(mapsRef, {
    name: data.name,
    createdBy: data.createdBy,
    memberCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMap(mapId: string, data: Partial<OrgMap>): Promise<void> {
  const docRef = doc(db, 'maps', mapId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteMap(mapId: string): Promise<void> {
  const batch = writeBatch(db);

  // Delete all nodes
  const nodesRef = collection(db, 'maps', mapId, 'nodes');
  const nodesSnapshot = await getDocs(nodesRef);
  nodesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete all unassigned members
  const membersRef = collection(db, 'maps', mapId, 'unassignedMembers');
  const membersSnapshot = await getDocs(membersRef);
  membersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete all history
  const historyRef = collection(db, 'maps', mapId, 'history');
  const historySnapshot = await getDocs(historyRef);
  historySnapshot.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete the map itself
  batch.delete(doc(db, 'maps', mapId));

  await batch.commit();
}

export async function duplicateMap(mapId: string, newName: string): Promise<string> {
  const original = await getMap(mapId);
  if (!original) throw new Error('Map not found');

  // Create new map
  const newMapId = await createMap({
    name: newName,
    createdBy: original.createdBy,
  });

  // Copy nodes
  const nodes = await getNodes(mapId);
  const batch = writeBatch(db);

  nodes.forEach((node) => {
    const newNodeRef = doc(collection(db, 'maps', newMapId, 'nodes'));
    batch.set(newNodeRef, {
      ...node,
      id: newNodeRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  // Copy unassigned members
  const members = await getUnassignedMembers(mapId);
  members.forEach((member) => {
    const newMemberRef = doc(collection(db, 'maps', newMapId, 'unassignedMembers'));
    batch.set(newMemberRef, {
      ...member,
      id: newMemberRef.id,
      createdAt: serverTimestamp(),
    });
  });

  await batch.commit();

  // Update member count
  await updateMap(newMapId, { memberCount: original.memberCount });

  return newMapId;
}

// ============ NODES ============

export async function getNodes(mapId: string): Promise<OrgNode[]> {
  const nodesRef = collection(db, 'maps', mapId, 'nodes');
  const q = query(nodesRef, orderBy('order'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
    updatedAt: toDate(doc.data().updatedAt),
  })) as OrgNode[];
}

export async function addNode(mapId: string, node: Omit<OrgNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const nodesRef = collection(db, 'maps', mapId, 'nodes');
  const docRef = await addDoc(nodesRef, {
    ...node,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update member count if it's a member node
  if (node.type === 'member') {
    const map = await getMap(mapId);
    if (map) {
      await updateMap(mapId, { memberCount: (map.memberCount || 0) + 1 });
    }
  }

  return docRef.id;
}

export async function updateNode(mapId: string, nodeId: string, data: Partial<OrgNode>): Promise<void> {
  const docRef = doc(db, 'maps', mapId, 'nodes', nodeId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  await updateMap(mapId, {}); // Touch map's updatedAt
}

export async function deleteNode(mapId: string, nodeId: string): Promise<void> {
  // Get the node first to check if it's a member
  const nodeRef = doc(db, 'maps', mapId, 'nodes', nodeId);
  const nodeSnap = await getDoc(nodeRef);

  if (nodeSnap.exists()) {
    const nodeData = nodeSnap.data();

    // Delete the node
    await deleteDoc(nodeRef);

    // Update member count if it was a member node
    if (nodeData.type === 'member') {
      const map = await getMap(mapId);
      if (map && map.memberCount) {
        await updateMap(mapId, { memberCount: Math.max(0, map.memberCount - 1) });
      }
    }

    // If it's a category, also delete all children
    if (nodeData.type === 'category') {
      const nodesRef = collection(db, 'maps', mapId, 'nodes');
      const snapshot = await getDocs(nodesRef);
      const batch = writeBatch(db);
      let deletedMembers = 0;

      snapshot.docs.forEach((doc) => {
        if (doc.data().parentId === nodeId) {
          batch.delete(doc.ref);
          if (doc.data().type === 'member') deletedMembers++;
        }
      });

      await batch.commit();

      // Update member count
      if (deletedMembers > 0) {
        const map = await getMap(mapId);
        if (map) {
          await updateMap(mapId, { memberCount: Math.max(0, (map.memberCount || 0) - deletedMembers) });
        }
      }
    }
  }
}

// ============ UNASSIGNED MEMBERS ============

export async function getUnassignedMembers(mapId: string): Promise<UnassignedMember[]> {
  const membersRef = collection(db, 'maps', mapId, 'unassignedMembers');
  const snapshot = await getDocs(membersRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: toDate(doc.data().createdAt),
  })) as UnassignedMember[];
}

export async function addUnassignedMember(
  mapId: string,
  member: Omit<UnassignedMember, 'id' | 'createdAt'>
): Promise<string> {
  const membersRef = collection(db, 'maps', mapId, 'unassignedMembers');
  const docRef = await addDoc(membersRef, {
    ...member,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteUnassignedMember(mapId: string, memberId: string): Promise<void> {
  const docRef = doc(db, 'maps', mapId, 'unassignedMembers', memberId);
  await deleteDoc(docRef);
}

// ============ HISTORY ============

export async function addHistoryEntry(
  mapId: string,
  entry: Omit<HistoryEntry, 'id' | 'timestamp'>
): Promise<string> {
  const historyRef = collection(db, 'maps', mapId, 'history');
  const docRef = await addDoc(historyRef, {
    ...entry,
    timestamp: serverTimestamp(),
  });
  return docRef.id;
}

export async function getHistory(mapId: string, limit = 50): Promise<HistoryEntry[]> {
  const historyRef = collection(db, 'maps', mapId, 'history');
  const q = query(historyRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.slice(0, limit).map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: toDate(doc.data().timestamp),
  })) as HistoryEntry[];
}

// ============ REAL-TIME LISTENERS ============

export function subscribeToMaps(callback: (maps: OrgMap[]) => void): () => void {
  const mapsRef = collection(db, 'maps');
  const q = query(mapsRef, orderBy('updatedAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const maps = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt),
    })) as OrgMap[];
    callback(maps);
  });
}

export function subscribeToNodes(mapId: string, callback: (nodes: OrgNode[]) => void): () => void {
  const nodesRef = collection(db, 'maps', mapId, 'nodes');
  const q = query(nodesRef, orderBy('order'));

  return onSnapshot(q, (snapshot) => {
    const nodes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
      updatedAt: toDate(doc.data().updatedAt),
    })) as OrgNode[];
    callback(nodes);
  });
}

export function subscribeToUnassignedMembers(
  mapId: string,
  callback: (members: UnassignedMember[]) => void
): () => void {
  const membersRef = collection(db, 'maps', mapId, 'unassignedMembers');

  return onSnapshot(membersRef, (snapshot) => {
    const members = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data().createdAt),
    })) as UnassignedMember[];
    callback(members);
  });
}
