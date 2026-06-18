import Dexie, { type Table } from 'dexie'
import type { ApiRequest, ApiResponse, KeyValue } from '../types/api'

export interface HistoryRecord {
  id?: number
  request: ApiRequest
  response: ApiResponse
  createdAt: number
  updated_at?: number
}

export interface EnvRecord {
  id?: number
  name: string
  variables: KeyValue[]
  headers: KeyValue[]
  isActive: boolean
  updated_at?: number
}

export interface OpenApiMeta {
  sourceUrl: string
  description?: string
  paramDescriptions?: Record<string, string>
  responseSchema?: string
}

export interface WorkspaceItem {
  id?: number
  uid: string          // 唯一字符串ID，用于拖拽引用
  name: string
  type: 'folder' | 'request'
  parentId: number | null  // 引用父节点的 id (number)
  order: number
  request?: ApiRequest
  createdAt: number
  updated_at?: number
  openapiMeta?: OpenApiMeta
}

class ArcDB extends Dexie {
  history!: Table<HistoryRecord, number>
  environments!: Table<EnvRecord, number>
  workspace!: Table<WorkspaceItem, number>

  constructor() {
    super('ArcDB_v2')
    this.version(1).stores({
      history: '++id, createdAt',
      environments: '++id, name, isActive',
      workspace: '++id, &uid, parentId, type, order',
    })
  }
}

export const db = new ArcDB()
