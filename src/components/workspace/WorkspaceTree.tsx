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
  RefreshCw,
  X,
} from 'lucide-react'
import { useRequestStore, useUiStore } from '../../store'
import type { WorkspaceTreeNode } from '../../hooks/useWorkspace'
import type { KeyValue } from '../../types/api'
import { useExpandSet } from '../../hooks/useExpandSet'
import { t } from '../../i18n'
import {
  loadWorkspaceTree,
  addWorkspaceFolder,
  addWorkspaceRequest,
  renameWorkspaceItem,
  deleteWorkspaceItem,
  moveWorkspaceItem,
  moveWorkspaceItems,
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
  selectedIds,
  setSelectedIds,
  lastClickedIdRef,
  flatNodes,
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
  selectedIds: Set<number>
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<number>>>
  lastClickedIdRef: React.MutableRefObject<number | null>
  flatNodes: WorkspaceTreeNode[]
  onCreateItem: (type: 'folder' | 'request', parentId: number) => void
}) {
  const loadRequest = useRequestStore((s) => s.loadRequest)
  const [dragging, setDragging] = useState(false)
  const [hovering, setHovering] = useState(false)
  const isExpanded = expandedIds.has(node.id!)
  const isEditing = editingId === node.id
  const isSelected = selectedIds.has(node.id!)
  const isDragOver = dragOverId === node.id

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverId(null)
    if (node.type === 'request') return
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const ids: number[] = data.ids || (data.id ? [data.id] : [])
    if (!ids.length || ids.includes(node.id!)) return
    if (ids.length === 1) {
      await moveWorkspaceItem(ids[0], node.id!, node.children.length)
    } else {
      await moveWorkspaceItems(ids, node.id!)
    }
    setSelectedIds(new Set())
    onRefresh()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowContextMenu({ id: node.id!, x: e.clientX, y: e.clientY })
  }

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds(new Set([node.id!]))
    lastClickedIdRef.current = node.id!
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
    const id = node.id!

    if (e.shiftKey && lastClickedIdRef.current != null) {
      // Shift: 范围选择
      const startIdx = flatNodes.findIndex((n) => n.id === lastClickedIdRef.current)
      const endIdx = flatNodes.findIndex((n) => n.id === id)
      if (startIdx >= 0 && endIdx >= 0) {
        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
        const range = new Set(selectedIds)
        for (let i = from; i <= to; i++) range.add(flatNodes[i].id!)
        setSelectedIds(range)
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd: 切换单个
      const next = new Set(selectedIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setSelectedIds(next)
      lastClickedIdRef.current = id
    } else {
      // 普通点击
      if (node.type === 'folder') {
        toggleExpand(node.id!)
      }
      if (selectedIds.has(id) && selectedIds.size === 1 && node.type === 'request') {
        // 再次点击已选中的 API：取消选中
        setSelectedIds(new Set())
        lastClickedIdRef.current = null
        return
      }
      setSelectedIds(new Set([id]))
      lastClickedIdRef.current = id
      if (node.request) loadRequest(node.request, node.openapiMeta)
    }
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
          const dragIds = selectedIds.has(node.id!) ? [...selectedIds] : [node.id!]
          e.dataTransfer.setData('text/plain', JSON.stringify({ ids: dragIds }))
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
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                lastClickedIdRef={lastClickedIdRef}
                flatNodes={flatNodes}
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const lastClickedIdRef = useRef<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [importTargetId, setImportTargetId] = useState<number | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [syncing, setSyncing] = useState(false)

  // 获取平铺的可见节点列表（用于 Shift 范围选择）
  function flattenVisible(nodes: WorkspaceTreeNode[]): WorkspaceTreeNode[] {
    const result: WorkspaceTreeNode[] = []
    for (const n of nodes) {
      result.push(n)
      if (expandedIds.has(n.id!)) result.push(...flattenVisible(n.children))
    }
    return result
  }

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

  // 下载 JSON 文件
  const downloadJson = useCallback((json: string, filename: string) => {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // 导出整个集合
  const handleExport = useCallback(async () => {
    try {
      const currentTree = await loadWorkspaceTree()
      if (currentTree.length === 0) {
        showToast(tr('noResults'), 'info')
        return
      }
      downloadJson(exportToOpenApi(currentTree), 'arc-openapi.json')
      showToast(tr('exportedSuccessfully'), 'success')
    } catch {
      showToast(tr('formatError'), 'error')
    }
  }, [showToast, tr, downloadJson])

  // 导出单个文件夹或 API
  const handleContextExport = useCallback(() => {
    if (!contextMenu) return
    const node = findNodeById(tree, contextMenu.id)
    if (!node) return
    try {
      const filename = `${node.name.replace(/[^a-zA-Z0-9一-鿿_-]/g, '_')}.openapi.json`
      downloadJson(exportToOpenApi([node]), filename)
      showToast(tr('exportedSuccessfully'), 'success')
    } catch {
      showToast(tr('formatError'), 'error')
    }
    setContextMenu(null)
  }, [contextMenu, tree, showToast, tr, downloadJson])

  // OpenAPI items → DB (共用)
  const doImport = useCallback(async (
    items: ReturnType<typeof parseOpenApi>,
    targetParentId: number | null = null,
  ) => {
    if (items.length === 0) {
      showToast(tr('noResults'), 'info')
      return
    }

    // 查重：已有集合中相同 method + url 的请求跳过
    const existingReqs = await db.workspace.where('type').equals('request').toArray()
    const seen = new Set(existingReqs.map((r) => `${r.request?.method ?? ''} ${r.request?.url ?? ''}`))

    const idMap = new Map<number, number>()
    const folders = items.filter((i) => i.type === 'folder')
    const requests = items.filter((i) => i.type === 'request')

    // tempIds: parseOpenApi creates folders with sequential tempIds (-1, -2, -3...)
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i]
      const newId = await db.workspace.add({
        uid: folder.uid,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentId !== null ? null : targetParentId,
        order: folder.order,
        createdAt: Date.now(),
      })
      idMap.set(-(i + 1), newId)
    }

    let skipped = 0
    for (const reqItem of requests) {
      const key = `${reqItem.request?.method ?? ''} ${reqItem.request?.url ?? ''}`
      if (seen.has(key)) {
        skipped++
        continue
      }
      seen.add(key)
      let realParentId: number | null = targetParentId
      if (reqItem.parentId !== null) {
        realParentId = idMap.get(reqItem.parentId) ?? targetParentId
      }
      await db.workspace.add({
        uid: reqItem.uid,
        name: reqItem.name,
        type: 'request',
        parentId: realParentId,
        order: reqItem.order,
        request: reqItem.request,
        openapiMeta: reqItem.openapiMeta,
        createdAt: Date.now(),
      })
    }

    bumpWorkspace()
    const imported = requests.length - skipped
    const msg = skipped > 0
      ? `${tr('importedFromOpenApi')} (${imported})，${skipped} ${tr('duplicatesSkipped')}`
      : `${tr('importedFromOpenApi')} (${imported})`
    showToast(msg, 'success')
  }, [showToast, tr, bumpWorkspace, lang])

  // 从文件导入
  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const items = parseOpenApi(await file.text(), 'http://localhost', file.name)
      await doImport(items, importTargetId)
      setShowImportPanel(false)
      setImportTargetId(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : tr('formatError'), 'error')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [showToast, tr, doImport])

  // 从 URL 导入
  const handleUrlImport = useCallback(async () => {
    const url = importUrl.trim()
    if (!url) return
    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const origin = new URL(url).origin
      const items = parseOpenApi(await res.text(), origin, importUrl.trim())
      await doImport(items, importTargetId)
      setImportUrl('')
      setShowImportPanel(false)
      setImportTargetId(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : tr('formatError'), 'error')
    }
  }, [importUrl, showToast, tr, doImport])

  // known OpenAPI endpoint paths to probe
  const SPEC_PATHS = ['/v3/api-docs', '/swagger.json', '/openapi.json', '/api-docs']

  // 同步：重新获取 sourceUrl 的 OpenAPI spec 并更新所有匹配的接口
  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const allItems = await db.workspace.toArray()

      // 1) 收集已有的 sourceUrl
      const sourceUrls = new Set<string>(
        allItems
          .filter((item) => item.openapiMeta?.sourceUrl && item.type === 'request')
          .map((item) => item.openapiMeta!.sourceUrl)
      )

      // 2) 对没有 openapiMeta 的请求，从 request URL 提取 origin，探测 OpenAPI 端点
      const itemsWithoutMeta = allItems.filter(
        (item) => item.type === 'request' && !item.openapiMeta?.sourceUrl && item.request?.url
      )
      const origins = new Set<string>()
      for (const item of itemsWithoutMeta) {
        try { origins.add(new URL(item.request!.url).origin) } catch { /* skip */ }
      }

      for (const origin of origins) {
        // 检查是否有已知 sourceUrl 已经覆盖同一个 origin（避免重复探测）
        if ([...sourceUrls].some((u) => { try { return new URL(u).origin === origin } catch { return false } })) continue

        for (const p of SPEC_PATHS) {
          const candidate = origin + p
          try {
            const res = await fetch(candidate)
            if (res.ok) {
              const text = await res.text()
              try {
                JSON.parse(text) // validate
                sourceUrls.add(candidate)
                break
              } catch { /* not valid JSON */ }
            }
          } catch { /* fetch failed */ }
        }
      }

      if (sourceUrls.size === 0) {
        showToast(tr('noResults'), 'info')
        return
      }

      let totalUpdated = 0

      for (const sourceUrl of sourceUrls) {
        try {
          const res = await fetch(sourceUrl)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const origin = new URL(sourceUrl).origin
          const newItems = parseOpenApi(await res.text(), origin, sourceUrl)

          // Normalize URL for matching: strip query string so old imports
          // (where query was baked into URL) still match the new clean URL
          const normalizeUrl = (url: string) => { try { const u = new URL(url); return `${u.protocol}//${u.host}${u.pathname}` } catch { return url.split('?')[0] } }

          // Build new spec index: method+normalizedUrl → spec item
          const newSpecIndex = new Map<string, typeof newItems[0]>()
          for (const item of newItems) {
            if (item.type === 'request' && item.request) {
              const key = `${item.request.method} ${normalizeUrl(item.request.url)}`
              newSpecIndex.set(key, item)
            }
          }

          // Helper: extract query params from URL and clean it
          const cleanUrlQuery = (url: string, qp: KeyValue[]) => {
            try {
              const u = new URL(url)
              if (!u.search) return { url, qp }
              const sp = new URLSearchParams(u.search)
              const existingKeys = new Set(qp.map(p => p.key))
              for (const [key, value] of sp) {
                if (!existingKeys.has(key)) {
                  qp.push({ key, value, enabled: true })
                }
              }
              return { url: `${u.protocol}//${u.host}${u.pathname}`, qp }
            } catch { return { url, qp } }
          }

          // Update existing items that match this source (either by openapiMeta.sourceUrl
          // or by request URL falling under the same origin — backfill for old imports)
          for (const existing of allItems) {
            if (existing.type !== 'request' || !existing.request) continue

            // Match by explicit sourceUrl, or by origin (for items without meta)
            const belongsToSource =
              existing.openapiMeta?.sourceUrl === sourceUrl ||
              (!existing.openapiMeta?.sourceUrl && (() => { try { return new URL(existing.request!.url).origin === origin } catch { return false } })())

            if (!belongsToSource) continue

            const updatedReq = { ...existing.request }

            // Always clean URL: extract baked-in query params into queryParams
            const cleaned = cleanUrlQuery(updatedReq.url, [...updatedReq.queryParams])
            updatedReq.url = cleaned.url
            updatedReq.queryParams = cleaned.qp

            const key = `${existing.request.method} ${normalizeUrl(updatedReq.url)}`
            const specItem = newSpecIndex.get(key)

            if (specItem?.request) {
              // Full merge with spec
              updatedReq.url = specItem.request.url

              for (const np of specItem.request.queryParams) {
                const idx = updatedReq.queryParams.findIndex((p) => p.key === np.key)
                if (idx >= 0) {
                  updatedReq.queryParams[idx] = {
                    ...updatedReq.queryParams[idx],
                    value: np.value || updatedReq.queryParams[idx].value,
                    ...(np.description ? { description: np.description } : {}),
                  }
                } else {
                  updatedReq.queryParams.push(np)
                }
              }

              for (const nh of specItem.request.headers) {
                const idx = updatedReq.headers.findIndex((h) => h.key === nh.key)
                if (idx >= 0) {
                  updatedReq.headers[idx] = {
                    ...updatedReq.headers[idx],
                    ...(nh.description ? { description: nh.description } : {}),
                  }
                } else {
                  updatedReq.headers.push(nh)
                }
              }

              await db.workspace.update(existing.id!, {
                name: specItem.name,
                request: updatedReq,
                openapiMeta: specItem.openapiMeta,
              })
            } else {
              // No spec match — just save the cleaned URL
              await db.workspace.update(existing.id!, {
                request: updatedReq,
              })
            }
            totalUpdated++
          }
        } catch (err) {
          showToast(`${tr('syncFailed')}: ${sourceUrl} — ${err instanceof Error ? err.message : ''}`, 'error')
        }
      }

      if (totalUpdated > 0) {
        bumpWorkspace()
        load()
        showToast(`${tr('syncedSuccessfully')}，${totalUpdated} ${tr('nItemsSynced')}`, 'success')
      } else {
        showToast(tr('noResults'), 'info')
      }
    } catch {
      showToast(tr('syncFailed'), 'error')
    } finally {
      setSyncing(false)
    }
  }, [showToast, tr, bumpWorkspace])

  const filteredTree = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return tree
    function filterNodes(nodes: WorkspaceTreeNode[]): WorkspaceTreeNode[] {
      const result: WorkspaceTreeNode[] = []
      for (const node of nodes) {
        const nameMatch = node.name.toLowerCase().includes(q)
        const urlMatch = node.type === 'request' ? (node.request?.url || '').toLowerCase().includes(q) : false
        const match = nameMatch || urlMatch
        let filteredChildren = filterNodes(node.children)
        if (match || filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren })
        }
      }
      return result
    }
    return filterNodes(tree)
  }, [tree, searchQuery])

  const flatNodes = useMemo(() => flattenVisible(filteredTree), [filteredTree, expandedIds])

  const handleCreateItem = useCallback(async (type: 'folder' | 'request', parentId: number | null) => {
    let newId: number
    if (type === 'folder') {
      newId = await addWorkspaceFolder(tr('newFolder'), parentId)
    } else {
      newId = await addWorkspaceRequest(tr('newRequest'), undefined, parentId)
    }
    if (parentId != null) {
      addExpanded(parentId)
    }
    setTree(await loadWorkspaceTree())
    setEditingId(newId)
    setSelectedIds(new Set([newId]))
    lastClickedIdRef.current = newId
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
    setSelectedIds(new Set([contextMenu.id]))
    lastClickedIdRef.current = contextMenu.id
    setContextMenu(null)
  }

  const handleContextDelete = async () => {
    if (!contextMenu) return
    // 多选时删除所有选中项，否则只删除右键目标
    const isMultiSelected = selectedIds.size > 1 && selectedIds.has(contextMenu.id)
    const idsToDelete = isMultiSelected ? [...selectedIds] : [contextMenu.id]

    // 收集所有待删项及其子孙
    let allSnapshots: Awaited<ReturnType<typeof collectDescendants>> = []
    for (const id of idsToDelete) {
      const snap = await collectDescendants(id)
      allSnapshots = allSnapshots.concat(snap)
      await deleteWorkspaceItem(id)
    }

    setSelectedIds(new Set())
    setContextMenu(null)
    load()
    const count = allSnapshots.length
    const label = count > 1
      ? `${tr('deletedSingle')} ${count} ${tr('deletedNItems')}`
      : `${tr('deletedSingle')}"${contextTarget?.name ?? tr('thisItem')}"`
    showToast(label, 'info', {
      label: tr('undo'),
      onClick: async () => {
        await restoreWorkspaceItems(allSnapshots)
        load()
        showToast(tr('undone'), 'success')
      },
    }, 6000)
  }

  const handleContextImport = () => {
    if (!contextMenu) return
    const node = findNodeById(tree, contextMenu.id)
    if (node?.type !== 'folder') return
    setImportTargetId(contextMenu.id)
    setShowImportPanel(true)
    setContextMenu(null)
  }

  const contextMenuItems = [
    ...(contextTarget?.type === 'folder'
      ? [
          { label: <><FolderPlus size={14} /> {tr('addSubfolder')}</>, action: handleContextCreateFolder },
          { label: <><FilePlus size={14} /> {tr('addRequestItem')}</>, action: handleContextCreateRequest },
          { label: <><Download size={14} /> {tr('importOpenApi')}</>, action: handleContextImport },
        ]
      : []),
    { label: <><Upload size={14} /> {tr('exportOpenApi')}</>, action: handleContextExport },
    { label: <><Pencil size={14} /> {tr('rename')}</>, action: handleContextRename },
    { label: <><Trash2 size={14} /> {tr('delete')}</>, action: handleContextDelete, danger: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* toolbar */}
      <div style={{ padding: '4px 4px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="input-linear"
            placeholder={tr('searchWorkspace')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 28, paddingRight: searchQuery ? 28 : 8, paddingTop: 6, paddingBottom: 6, fontSize: 12 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="btn-clear-search"
              style={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                padding: 2, borderRadius: 4, color: 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className="btn-ghost-linear"
          style={{ padding: '5px 7px', display: 'flex', alignItems: 'center' }}
          onClick={handleExport}
          title={tr('exportOpenApi')}
        >
          <Upload size={14} />
        </button>
        <button
          className="btn-ghost-linear"
          style={{ padding: '5px 7px', display: 'flex', alignItems: 'center' }}
          onClick={() => { setImportTargetId(null); setShowImportPanel(!showImportPanel) }}
          title={tr('importOpenApi')}
        >
          <Download size={14} />
        </button>
        <button
          className="btn-ghost-linear"
          style={{ padding: '5px 7px', display: 'flex', alignItems: 'center' }}
          onClick={handleSync}
          title={tr('sync')}
          disabled={syncing}
        >
          <RefreshCw size={14} style={syncing ? { animation: 'spin 1s linear infinite' } : undefined} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>

      {/* Import panel */}
      {showImportPanel && (
        <div style={{ padding: '0 4px 6px' }}>
          <div className="slab-subtle" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {importTargetId != null && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Folder size={12} />
                {tr('import_')} → {findNodeById(tree, importTargetId)?.name ?? '…'}
                <button
                  onClick={() => { setImportTargetId(null); setShowImportPanel(false) }}
                  style={{ marginLeft: 'auto', padding: '1px 4px', color: 'var(--text-tertiary)' }}
                >
                  <X size={11} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                className="input-linear"
                placeholder={tr('openApiUrlPlaceholder')}
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleUrlImport() }}
                style={{ flex: 1, paddingTop: 5, paddingBottom: 5, fontSize: 11 }}
              />
              <button
                className="btn-brand"
                style={{ padding: '4px 10px', fontSize: 11, fontWeight: 510 }}
                onClick={handleUrlImport}
                disabled={!importUrl.trim()}
              >
                {tr('import_')}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{tr('or')}</span>
              <button
                className="btn-ghost-linear"
                style={{ padding: '3px 8px', fontSize: 11 }}
                onClick={() => fileInputRef.current?.click()}
              >
                {tr('importFromFile')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* tree */}
      <div
        style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '2px 0' }}
        onClick={(e) => { if (e.target === e.currentTarget) { setSelectedIds(new Set()); setContextMenu(null) } }}
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
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            lastClickedIdRef={lastClickedIdRef}
            flatNodes={flatNodes}
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
