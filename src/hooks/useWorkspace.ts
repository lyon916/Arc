import { db, type WorkspaceItem } from '../db'

function genUid(): string {
  return `ws-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

async function getNextOrder(parentId: number | null): Promise<number> {
  const siblings = await getSiblings(parentId)
  return siblings.reduce((max, s) => Math.max(max, s.order), -1) + 1
}

export interface WorkspaceTreeNode extends WorkspaceItem {
  children: WorkspaceTreeNode[]
}

async function getSiblings(parentId: number | null): Promise<WorkspaceItem[]> {
  if (parentId != null) {
    return db.workspace.where('parentId').equals(parentId).toArray()
  }
  return (await db.workspace.toArray()).filter(item => item.parentId == null)
}

function buildTree(items: WorkspaceItem[]): WorkspaceTreeNode[] {
  const map = new Map<number, WorkspaceTreeNode>()
  const roots: WorkspaceTreeNode[] = []

  for (const item of items) {
    map.set(item.id!, { ...item, children: [] })
  }

  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (nodes: WorkspaceTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.order - b.order
    })
    for (const n of nodes) sortNodes(n.children)
  }
  sortNodes(roots)
  return roots
}

export async function loadWorkspaceTree(): Promise<WorkspaceTreeNode[]> {
  const items = await db.workspace.toArray()
  return buildTree(items)
}

export async function addWorkspaceFolder(name: string, parentId: number | null): Promise<number> {
  return db.workspace.add({
    uid: genUid(),
    name,
    type: 'folder',
    parentId,
    order: await getNextOrder(parentId),
    createdAt: Date.now(),
    updated_at: Date.now(),
  })
}

export async function addWorkspaceRequest(name: string, request: WorkspaceItem['request'], parentId: number | null): Promise<number> {
  return db.workspace.add({
    uid: genUid(),
    name,
    type: 'request',
    parentId,
    order: await getNextOrder(parentId),
    request,
    createdAt: Date.now(),
    updated_at: Date.now(),
  })
}

export async function renameWorkspaceItem(id: number, name: string): Promise<void> {
  await db.workspace.update(id, { name, updated_at: Date.now() })
}

export async function deleteWorkspaceItem(id: number): Promise<void> {
  const children = await db.workspace.where('parentId').equals(id).toArray()
  for (const child of children) {
    await deleteWorkspaceItem(child.id!)
  }
  await db.workspace.delete(id)
}

export async function collectDescendants(id: number): Promise<WorkspaceItem[]> {
  const result: WorkspaceItem[] = []
  const item = await db.workspace.get(id)
  if (item) {
    result.push(item)
    const children = await db.workspace.where('parentId').equals(id).toArray()
    for (const child of children) {
      const descendants = await collectDescendants(child.id!)
      result.push(...descendants)
    }
  }
  return result
}

export async function restoreWorkspaceItems(items: WorkspaceItem[]): Promise<void> {
  for (const item of items) {
    await db.workspace.add(item)
  }
}

export async function moveWorkspaceItem(
  id: number,
  newParentId: number | null,
  newOrder: number,
): Promise<void> {
  const item = await db.workspace.get(id)
  if (!item) return

  // 防止把文件夹拖进自己的子文件夹
  if (item.type === 'folder' && newParentId) {
    const isDescendant = await isDescendantOf(newParentId, id)
    if (isDescendant) return
  }

  // 更新目标项
  await db.workspace.update(id, { parentId: newParentId, order: newOrder, updated_at: Date.now() })

  // 重排同级顺序
  const siblings = await getSiblings(newParentId)

  const sorted = siblings.filter(s => s.id !== id).sort((a, b) => a.order - b.order)
  let targetOrder = 0
  for (const s of sorted) {
    if (targetOrder === newOrder) targetOrder++
    if (s.order !== targetOrder) {
      await db.workspace.update(s.id!, { order: targetOrder })
    }
    targetOrder++
  }
}

export async function moveWorkspaceItems(
  ids: number[],
  targetParentId: number | null,
): Promise<void> {
  if (!ids.length) return
  const target = targetParentId ? await db.workspace.get(targetParentId) : null
  if (target && target.type !== 'folder') return

  const siblings = await getSiblings(targetParentId)
  let nextOrder = siblings.length

  for (const id of ids) {
    const item = await db.workspace.get(id)
    if (!item) continue
    if (targetParentId && item.type === 'folder') {
      const desc = await isDescendantOf(targetParentId, id)
      if (desc) continue
    }
    await db.workspace.update(id, { parentId: targetParentId, order: nextOrder, updated_at: Date.now() })
    nextOrder++
  }

  const updated = await getSiblings(targetParentId)
  const sorted = updated.sort((a, b) => a.order - b.order)
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].order !== i) {
      await db.workspace.update(sorted[i].id!, { order: i, updated_at: Date.now() })
    }
  }
}

async function isDescendantOf(ancestorId: number, descendantId: number): Promise<boolean> {
  const item = await db.workspace.get(descendantId)
  if (!item || !item.parentId) return false
  if (item.parentId === ancestorId) return true
  return isDescendantOf(ancestorId, item.parentId)
}

export async function findWorkspaceDuplicate(
  url: string,
  method: string,
  parentId: number | null,
): Promise<WorkspaceItem | null> {
  const siblings = await getSiblings(parentId)
  return siblings.find(
    (s) => s.type === 'request' && s.request?.url === url && s.request?.method === method,
  ) ?? null
}

export async function saveRequestToWorkspace(
  name: string,
  request: WorkspaceItem['request'],
  targetId: number | null,
): Promise<number> {
  return db.workspace.add({
    uid: genUid(),
    name,
    type: 'request',
    parentId: targetId,
    order: await getNextOrder(targetId),
    request,
    createdAt: Date.now(),
    updated_at: Date.now(),
  })
}
