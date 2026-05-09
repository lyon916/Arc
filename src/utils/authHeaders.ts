import type { AuthType, KeyValue } from '../types/api'

export function buildAuthHeader(
  authType: AuthType,
  authToken: string,
  authUser: string,
  authPass: string,
): KeyValue | null {
  if (authType === 'none') return null
  if (authType === 'bearer' && authToken) {
    return { key: 'Authorization', value: `Bearer ${authToken}`, enabled: true }
  }
  if (authType === 'basic' && (authUser || authPass)) {
    const encoded = btoa(`${authUser}:${authPass}`)
    return { key: 'Authorization', value: `Basic ${encoded}`, enabled: true }
  }
  return null
}