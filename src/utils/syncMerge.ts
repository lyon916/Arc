/**
 * 同步合并工具 — last-write-wins 策略
 */

export interface SyncableItem {
  updated_at: number
}

/**
 * 比较本地和远端两条记录，返回较新的版本。
 * 如果两者 updated_at 相同，保留本地版本。
 */
export function pickNewer<T extends SyncableItem>(local: T | null, remote: T | null): T | null {
  if (!local && !remote) return null
  if (!local) return remote
  if (!remote) return local
  return local.updated_at >= remote.updated_at ? local : remote
}
