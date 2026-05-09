import { useRequestStore, useUiStore } from '../store'
import { saveRequestToWorkspace, findWorkspaceDuplicate } from '../hooks/useWorkspace'
import { db } from '../db'
import { t } from '../i18n'

export async function executeSave(opts?: { silent?: boolean }): Promise<void> {
  const silent = opts?.silent ?? false
  const { request } = useRequestStore.getState()
  const { bumpWorkspace, showToast, lang } = useUiStore.getState()
  const tr = (key: string) => t[lang]?.[key] ?? key

  if (!request.url) {
    if (!silent) showToast(tr('pleaseEnterUrl'), 'info')
    return
  }
  try {
    const defaultName = new URL(request.url.startsWith('http') ? request.url : `https://${request.url}`).pathname.replace(/^\//, '') || tr('unnamedRequest')
    const dup = await findWorkspaceDuplicate(request.url, request.method, null)
    if (dup) {
      await db.workspace.update(dup.id!, { request })
      bumpWorkspace()
      if (!silent) showToast(`${tr('updatedParams')}「${dup.name}」`, 'success')
      return
    }
    const name = silent ? defaultName : (prompt(tr('requestName'), defaultName) || defaultName)
    await saveRequestToWorkspace(name, request, null)
    bumpWorkspace()
    if (!silent) showToast(`${tr('savedToWorkspace')}「${name}」`, 'success')
  } catch {
    showToast(tr('saveFailed'), 'error')
  }
}
