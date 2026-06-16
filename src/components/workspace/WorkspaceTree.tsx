import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Ellipsis,
  FolderPlus,
  FilePlus,
  Pencil,
  Trash2,
  Search,
  Upload,
  Download,
} from 'lucide-react'
import { useRequestStore, useUiStore } from '../../store'
import type { WorkspaceTreeNode } from '../../hooks/useWorkspace'
import { useExpandSet } from '../../hooks/useExpandSet'
import { t } from '../../i18n'
import {
  loadWorkspaceTree,
  addWorkspaceFolder,
  addWorkspaceRequest,
  renameWorkspaceItem,
  deleteWorkspaceItem,
  moveWorkspaceItem,
  collectDescendants,
  restoreWorkspaceItems,
} from '../../hooks/useWorkspace'
import ContextMenu from '../common/ContextMenu'
import Tooltip from '../common/Tooltip'
import { exportToOpenApi, parseOpenApi } from '../../utils/openapi'
import { db } from '../../db'

// ---- helpers ----

function findNodeById(nodes: WorkspaceTreeNode[], id: number): WorkspaceTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

// ---- Inline name editor ----
function NameEditor({ name, onSave, onCancel }: { name: string; onSave: (n: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  return (
    <input
      ref={ref}
      defaultValue={name}
      className="input-linear"
      style={{ fontSize: 13, padding: '2px 8px', height: 26, flex: 1, borderRadius: 4 }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { const v = ref.current!.value.trim(); if (v) onSave(v); else onCancel() }
        if (e.key === 'Escape') onCancel()
      }}
      onBlur={() => { const v = ref.current!.value.trim(); if (v && v !== name) onSave(v); else onCancel() }}
    />
  )
}

// ---- Mini icon button ----
const miniBtnStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--text-tertiary)',
  flexShrink: 0,
  transition: 'color 0.15s, background 0.15s',
}

// ---- Tree Node ----
function TreeNode({
  node,
  depth,
  onRefresh,
  expandedIds,
  toggleExpand,
  dragOverId,
  setDragOverId,
  showContextMenu,
  setShowContextMenu,
  editingId,
  setEditingId,
  selectedId,
  setSelectedId,
  onCreateItem,
}: {
  node: WorkspaceTreeNode
  depth: number
  onRefresh: () => void
  expandedIds: Set<number>
  toggleExpand: (id: number) => void
  dragOverId: number | null
  setDragOverId: (id: number | null) => void
  showContextMenu: { id: number; x: number; y: number } | null
  setShowContextMenu: (v: { id: number; x: number; y: number } | null) => void
  editingId: number | null
  setEditingId: (id: number | null) => void
  selectedId: number | null
  setSelectedId: (id: number | null) => void
  onCreateItem: (type: 'folder' | 'request', parentId: number) => void
}) {
  const loadRequest = useRequestStore((s) => s.loadRequest)
  const [dragging, setDragging] = useState(false)
  const [hovering, setHovering] = useState(false)
  const isExpanded = expandedIds.has(node.id!)
  const isEditing = editingId === node.id
  const isSelected = selectedId === node.id
  const isDragOver = dragOverId === node.id

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverId(null)
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    if (data.id === node.id || node.type === 'request') return
    await moveWorkspaceItem(data.id, node.id!, node.children.length)
    onRefresh()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowContextMenu({ id: node.id!, x: e.clientX, y: e.clientY })
  }

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedId(node.id!)
    setShowContextMenu({ id: node.id!, x: e.clientX, y: e.clientY })
  }

  const handleRename = async (newName: string) => {
    await renameWorkspaceItem(node.id!, newName)
    setEditingId(null)
    onRefresh()
  }

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.type === 'folder') toggleExpand(node.id!)
  }

  const handleRowClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.type === 'folder') {
      toggleExpand(node.id!)
      setSelectedId(node.id!)
      return
    }
    if (selectedId === node.id) {
      setSelectedId(null)
      return
    }
    setSelectedId(node.id!)
    if (node.request) loadRequest(node.request)
  }

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCreateItem('request', node.id!)
  }

  const ROW_HEIGHT = 36

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({ id: node.id }))
          setDragging(true)
        }}
        onDragEnd={() => setDragging(false)}
        onDragOver={(e) => { e.preventDefault(); if (node.type === 'folder') setDragOverId(node.id!) }}
        onDragLeave={(e) => {
          if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as HTMLElement)) {
            setDragOverId(null)
          }
        }}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        onClick={handleRowClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          paddingLeft: `${depth * 12 + 8}px`,
          paddingRight: 4,
          height: ROW_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          cursor: 'pointer',
          borderRadius: 4,
          background: isDragOver
            ? 'var(--accent-brand-light)'
            : isSelected
              ? 'var(--accent-brand-light)'
              : hovering
                ? 'var(--bg-hover)'
                : 'transparent',
          transition: 'background 0.15s',
          fontSize: 13,
          opacity: dragging ? 0.4 : 1,
          fontFeatureSettings: '"cv01", "ss03"',
        }}
      >
        {/* expand arrow */}
        <span
          onClick={handleArrowClick}
          style={{
            width: node.type === 'folder' ? 18 : 0,
            height: ROW_HEIGHT,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: node.type === 'folder' ? 'pointer' : 'default',
            color: 'var(--text-tertiary)',
          }}
        >
          {node.type === 'folder' && (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>

        {/* type icon */}
        <span style={{
          width: 18,
          height: ROW_HEIGHT,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--text-tertiary)',
        }}>
          {node.type === 'folder' && (
            isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />
          )}
        </span>

        {/* HTTP method badge (requests only) */}
        {node.type === 'request' && (
          <span
            className={`method-${(node.request?.method || 'GET').toLowerCase()}-bg`}
            style={{
              borderRadius: 6,
              fontWeight: 510,
              fontSize: 10,
              padding: '2px 6px',
              lineHeight: 1.4,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {node.request?.method || 'REQ'}
          </span>
        )}

        {/* name or edit input */}
        {isEditing ? (
          <NameEditor name={node.name} onSave={handleRename} onCancel={() => setEditingId(null)} />
        ) : (
          <span style={{ flex: 1, minWidth: 0 }}>
            <Tooltip text={node.name}>
              <span
                style={{
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  userSelect: 'none',
                  lineHeight: `${ROW_HEIGHT}px`,
                }}
              >
                {node.name}
              </span>
            </Tooltip>
          </span>
        )}

        {/* hover actions */}
        <div
          style={{
            display: hovering && !isEditing ? 'flex' : 'none',
            gap: 2,
            flexShrink: 0,
            alignItems: 'center',
          }}
        >
          {node.type === 'folder' && (
            <button
              title="Add request"
              onClick={handleQuickAdd}
              onMouseDown={(e) => e.stopPropagation()}
              style={miniBtnStyle}
            >
              <Plus size={14} />
            </button>
          )}
          <button
            title="More actions"
            onClick={handleMoreClick}
            onMouseDown={(e) => e.stopPropagation()}
            style={miniBtnStyle}
          >
            <Ellipsis size={14} />
          </button>
        </div>
      </div>

      {node.type === 'folder' && (
        <div className={`tree-collapse ${isExpanded ? 'open' : ''}`}>
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.id!}
                node={child}
                depth={depth + 1}
                onRefresh={onRefresh}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
                dragOverId={dragOverId}
                setDragOverId={setDragOverId}
                showContextMenu={showContextMenu}
                setShowContextMenu={setShowContextMenu}
                editingId={editingId}
                setEditingId={setEditingId}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                onCreateItem={onCreateItem}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Workspace Tree ----
export default function WorkspaceTree() {
  const [tree, setTree] = useState<WorkspaceTreeNode[]>([])
  const { ids: expandedIds, toggle: toggleExpand, add: addExpanded } = useExpandSet<number>([], 'arc-expanded-ids')
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const workspaceVersion = useUiStore((s) => s.workspaceVersion)
  const showToast = useUiStore((s) => s.showToast)
  const lang = useUiStore((s) => s.lang)
  const tr = (key: string) => t[lang]?.[key] ?? key
  const load = useCallback(async () => {
    try { setTree(await loadWorkspaceTree()) } catch { /* silent */ }
  }, [])
  useEffect(() => { load() }, [workspaceVersion])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bumpWorkspace = useUiStore((s) => s.bumpWorkspace)

  // 导出 OpenAPI
  const handleExport = useCallback(async () => {
    try {
      const currentTree = await loadWorkspaceTree()
      if (currentTree.length === 0) {
        showToast(tr('noResults'), 'info')
        return
      }
      const json = exportToOpenApi(currentTree)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'arc-openapi.json'
      a.click()
      URL.revokeObjectURL(url)
      showToast(tr('exportedSuccessfully'), 'success')
    } catch {
      showToast(tr('formatError'), 'error')
    }
  }, [showToast, tr])

  // 导入 OpenAPI
  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const items = parseOpenApi(text)
      if (items.length === 0) {
        showToast(tr('noResults'), 'info')
        return
      }

      // 分批插入：先 folder 再 request，重映射 parentId
      const idMap = new Map<number, number>() // tempId → real DB id
      const folders = items.filter((i) => i.type === 'folder')
      const requests = items.filter((i) => i.type === 'request')

      for (const folder of folders) {
        const newId = await db.workspace.add({
          uid: folder.uid,
          name: folder.name,
          type: 'folder',
          parentId: null,
          order: folder.order,
          createdAt: Date.now(),
        })
        idMap.set(folder.uid as unknown as number, newId)
        // Also map by the index position just in case
        const oldId = folder.uid.replace('ws-import-', '')
        idMap.set(Number(oldId), newId)
      }

      for (const reqItem of requests) {
        let realParentId: number | null = null
        if (reqItem.parentId !== null) {
          realParentId = idMap.get(reqItem.parentId) ?? null
        }
        await db.workspace.add({
          uid: reqItem.uid,
          name: reqItem.name,
          type: 'request',
          parentId: realParentId,
          order: reqItem.order,
          request: reqItem.request,
          createdAt: Date.now(),
        })
      }

      bumpWorkspace()
      showToast(tr('importedFromOpenApi'), 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : tr('formatError')
      showToast(msg, 'error')
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [showToast, tr, bumpWorkspace])

  const filteredTree = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return tree
    function filterNodes(nodes: WorkspaceTreeNode[]): WorkspaceTreeNode[] {
      const result: WorkspaceTreeNode[] = []
      for (const node of nodes) {
        const nameMatch = node.name.toLowerCase().includes(q)
        let filteredChildren = filterNodes(node.children)
        if (nameMatch || filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren })
        }
      }
      return result
    }
    return filterNodes(tree)
  }, [tree, searchQuery])

  const handleCreateItem = useCallback(async (type: 'folder' | 'request', parentId: number | null) => {
    let newId: number
    if (type === 'folder') {
      newId = await addWorkspaceFolder('New Folder', parentId)
    } else {
      newId = await addWorkspaceRequest('New Request', undefined, parentId)
    }
    if (parentId != null) {
      addExpanded(parentId)
    }
    setTree(await loadWorkspaceTree())
    setEditingId(newId)
    setSelectedId(newId)
  }, [])

  const contextTarget = contextMenu ? findNodeById(tree, contextMenu.id) : null

  const handleContextCreateFolder = () => {
    if (!contextMenu) return
    const parentId = contextTarget?.type === 'folder' ? contextTarget.id! : null
    handleCreateItem('folder', parentId)
    setContextMenu(null)
  }

  const handleContextCreateRequest = () => {
    if (!contextMenu) return
    const parentId = contextTarget?.type === 'folder' ? contextTarget.id! : null
    handleCreateItem('request', parentId)
    setContextMenu(null)
  }

  const handleContextRename = () => {
    if (!contextMenu) return
    setEditingId(contextMenu.id)
    setSelectedId(contextMenu.id)
    setContextMenu(null)
  }

  const handleContextDelete = async () => {
    if (!contextMenu) return
    const id = contextMenu.id
    const snapshot = await collectDescendants(id)
    await deleteWorkspaceItem(id)
    if (selectedId === id) setSelectedId(null)
    setContextMenu(null)
    load()
    const label = snapshot.length > 1 ? `已删除 ${snapshot.length} 项` : `已删除"${contextTarget?.name ?? '此项'}"`
    showToast(label, 'info', {
      label: tr('undo'),
      onClick: async () => {
        await restoreWorkspaceItems(snapshot)
        load()
        showToast(tr('undone'), 'success')
      },
    }, 6000)
  }

  const contextMenuItems = [
    ...(contextTarget?.type === 'folder'
      ? [
          { label: <><FolderPlus size={14} /> Add Subfolder</>, action: handleContextCreateFolder },
          { label: <><FilePlus size={14} /> Add Request</>, action: handleContextCreateRequest },
        ]
      : []),
    { label: <><Pencil size={14} /> Rename</>, action: handleContextRename },
    { label: <><Trash2 size={14} /> Delete</>, action: handleContextDelete, danger: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* toolbar */}
      <div style={{ padding: '4px 4px 6px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-linear"
            placeholder={tr('searchWorkspace')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 28, paddingTop: 6, paddingBottom: 6, fontSize: 12 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button
            className="btn-ghost-linear"
            style={{ flex: 1, padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            onClick={handleExport}
            title={tr('exportOpenApi')}
          >
            <Download size={13} />
            {tr('exportOpenApi')}
          </button>
          <button
            className="btn-ghost-linear"
            style={{ flex: 1, padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            onClick={() => fileInputRef.current?.click()}
            title={tr('importOpenApi')}
          >
            <Upload size={13} />
            {tr('importOpenApi')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
        </div>
      </div>

      {/* tree */}
      <div
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '2px 0' }}
        onClick={(e) => { if (e.target === e.currentTarget) { setSelectedId(null); setContextMenu(null) } }}
      >
        {filteredTree.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '32px 16px',
            color: 'var(--text-tertiary)',
            fontSize: 12,
            textAlign: 'center',
            gap: 8,
          }}>
            <Folder size={28} opacity={0.3} />
            <span>{tree.length === 0 ? tr('startHint') : tr('noResults')}</span>
          </div>
        )}
        {filteredTree.map((node) => (
          <TreeNode
            key={node.id!}
            node={node}
            depth={0}
            onRefresh={load}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            dragOverId={dragOverId}
            setDragOverId={setDragOverId}
            showContextMenu={contextMenu}
            setShowContextMenu={setContextMenu}
            editingId={editingId}
            setEditingId={setEditingId}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            onCreateItem={handleCreateItem}
          />
        ))}
      </div>

      {/* context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
