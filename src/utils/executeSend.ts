import { useRequestStore, useUiStore } from '../store'
import { sendRequest } from './fetch'
import { executeSave } from './executeSave'
import { t } from '../i18n'

let currentController: AbortController | null = null

export function cancelSend(): void {
  if (currentController) {
    currentController.abort()
    currentController = null
  }
}

export async function executeSend(): Promise<void> {
  const { request, loading, setLoading, setResponse, setError, setStreamingBody } = useRequestStore.getState()
  const { bumpHistory, autoSave, lang } = useUiStore.getState()
  const tr = (key: string) => t[lang]?.[key] ?? key

  if (!request.url || loading) return

  cancelSend()
  currentController = new AbortController()

  setLoading(true)
  setError(null)
  setResponse(null)
  setStreamingBody(null)
  try {
    const response = await sendRequest(request, currentController.signal)
    setResponse(response)
    if (autoSave) executeSave({ silent: true })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    const message = err instanceof Error ? err.message : String(err)
    const friendly = message.includes('Failed to fetch') || message.includes('NetworkError')
      ? tr('cannotConnect')
      : message
    setError(friendly)
  } finally {
    setLoading(false)
    currentController = null
    bumpHistory()
  }
}
