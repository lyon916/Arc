import { useCallback, useRef } from 'react'
import { useAuthStore, useUiStore } from '../store'
import { syncPull, syncPush, type SyncChange } from '../utils/api'
import { db } from '../db'
import type { HistoryRecord } from '../db'

/**
 * Sync engine — push/pull cloud sync for workspace, history, environments.
 *
 * History payload omits response.body (kept local-only).
 */

const DATA_TYPES = ['workspace', 'history', 'environment'] as const

export function useSync() {
  const syncStatus = useAuthStore((s) => s.syncStatus)
  const setSyncStatus = useAuthStore((s) => s.setSyncStatus)
  const { bumpHistory, bumpWorkspace } = useUiStore.getState()
  const lastSyncTs = useRef(0)

  const fullSync = useCallback(async () => {
    const { user, sessionToken } = useAuthStore.getState()
    if (!user || !sessionToken) return

    setSyncStatus('syncing')
    try {
      // 1. Pull all remote changes
      const remoteChanges = await syncPull(0, [...DATA_TYPES])
      await applyRemoteChanges(remoteChanges)

      // 2. Push all local changes (since beginning of time)
      const localChanges = await collectLocalChanges(0)
      if (localChanges.length > 0) {
        await syncPush(localChanges)
      }

      lastSyncTs.current = Date.now()
      setSyncStatus('ok')
      bumpHistory()
      bumpWorkspace()
    } catch {
      setSyncStatus('error')
    }
  }, [setSyncStatus, bumpHistory, bumpWorkspace])

  const incrementalSync = useCallback(async () => {
    const { user, sessionToken } = useAuthStore.getState()
    if (!user || !sessionToken) return

    setSyncStatus('syncing')
    try {
      // Pull changes since last sync
      const remoteChanges = await syncPull(lastSyncTs.current, [...DATA_TYPES])
      if (remoteChanges.length > 0) {
        await applyRemoteChanges(remoteChanges)
        bumpHistory()
        bumpWorkspace()
      }

      // Push local changes since last sync
      const localChanges = await collectLocalChanges(lastSyncTs.current)
      if (localChanges.length > 0) {
        await syncPush(localChanges)
      }

      lastSyncTs.current = Date.now()
      setSyncStatus('ok')
    } catch {
      setSyncStatus('error')
    }
  }, [setSyncStatus, bumpHistory, bumpWorkspace])

  return {
    syncStatus,
    fullSync,
    incrementalSync,
  }
}

// ---- Helpers ----

async function applyRemoteChanges(changes: SyncChange[]): Promise<void> {
  for (const c of changes) {
    switch (c.data_type) {
      case 'workspace': {
        const remote = JSON.parse(c.payload)
        const local = await db.workspace.where('uid').equals(c.item_key).first()

        if (c.deleted) {
          if (local) await db.workspace.delete(local.id!)
          continue
        }

        if (!local) {
          await db.workspace.add(remote)
        } else if ((remote.updated_at || 0) > (local.updated_at || 0)) {
          await db.workspace.update(local.id!, { ...remote, id: local.id })
        }
        break
      }

      case 'history': {
        const remote = JSON.parse(c.payload) as { request: HistoryRecord['request']; createdAt: number; updated_at: number }

        if (c.deleted) {
          // Find by url+method and delete
          const all = await db.history.toArray()
          const match = all.find(h => h.request.url === remote.request.url && h.request.method === remote.request.method)
          if (match) await db.history.delete(match.id!)
          continue
        }

        // Find existing history entry by url+method
        let existingId: number | null = null
        await db.history.orderBy('createdAt').reverse().each(r => {
          if (!existingId && r.request.url === remote.request.url && r.request.method === remote.request.method) {
            existingId = r.id!
          }
        })

        if (existingId) {
          const existing = await db.history.get(existingId)
          if (existing && (remote.updated_at || 0) > (existing.updated_at || 0)) {
            // Only update request + meta; preserve local response body
            await db.history.update(existingId, {
              request: remote.request,
              createdAt: remote.createdAt,
              updated_at: remote.updated_at,
              // response intentionally NOT updated — keep local-only
            })
          }
        } else {
          await db.history.add({
            request: remote.request,
            response: { status: 0, statusText: '', headers: {}, body: '', size: 0, duration: 0 },
            createdAt: remote.createdAt,
            updated_at: remote.updated_at,
          })
        }
        break
      }

      case 'environment': {
        const remote = JSON.parse(c.payload)

        if (c.deleted) {
          const local = await db.environments.get(Number(c.item_key))
          if (local) await db.environments.delete(local.id!)
          continue
        }

        const local = await db.environments.get(Number(c.item_key))
        if (!local) {
          await db.environments.add(remote)
        } else if ((remote.updated_at || 0) > (local.updated_at || 0)) {
          await db.environments.update(local.id!, { ...remote, id: local.id })
        }
        break
      }
    }
  }
}

async function collectLocalChanges(since: number): Promise<SyncChange[]> {
  const changes: SyncChange[] = []

  const toChange = (data_type: SyncChange['data_type'], item_key: string, payload: unknown, updated_at: number): SyncChange => ({
    data_type,
    item_key,
    payload: JSON.stringify(payload),
    updated_at,
    deleted: false,
  })

  // Workspace items updated since `since`
  const wsItems = await db.workspace.filter(i => (i.updated_at || 0) > since).toArray()
  for (const item of wsItems) {
    changes.push(toChange('workspace', item.uid, item, item.updated_at || Date.now()))
  }

  // History records updated since `since` — strip response.body
  const hItems = await db.history.filter(i => (i.updated_at || 0) > since).toArray()
  for (const h of hItems) {
    const payload = {
      request: h.request,
      createdAt: h.createdAt,
      updated_at: h.updated_at || Date.now(),
    }
    changes.push(toChange('history', `${h.request.method}:${h.request.url}`, payload, h.updated_at || Date.now()))
  }

  // Environments updated since `since`
  const envItems = await db.environments.filter(i => (i.updated_at || 0) > since).toArray()
  for (const e of envItems) {
    changes.push(toChange('environment', String(e.id!), e, e.updated_at || Date.now()))
  }

  return changes
}
