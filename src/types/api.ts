export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
export type BodyType = 'json' | 'formdata' | 'raw' | 'none'
export type AuthType = 'none' | 'bearer' | 'basic'

export interface KeyValue {
  key: string
  value: string
  enabled: boolean
}

export interface ApiRequest {
  method: HttpMethod
  url: string
  headers: KeyValue[]
  bodyType: BodyType
  bodyJson: string
  bodyFormData: KeyValue[]
  bodyRaw: string
  queryParams: KeyValue[]
  authType: AuthType
  authToken: string       // Bearer token
  authUser: string        // Basic Auth username
  authPass: string        // Basic Auth password
}

export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  size: number
  duration: number
}