import { db, type HistoryRecord } from '../db'

export async function saveHistory(record: HistoryRecord): Promise<number> {
  const { url, method } = record.request

  let existingId: number | null = null
  await db.history.orderBy('createdAt').reverse().each((r) => {
    if (existingId == null && r.request.url === url && r.request.method === method) {
      existingId = r.id!
    }
  })

  if (existingId != null) {
    await db.history.update(existingId, {
      response: record.response,
      createdAt: Date.now(),
    })
    return existingId
  }

  return db.history.add(record)
}

export async function loadHistory(): Promise<HistoryRecord[]> {
  return db.history.orderBy('createdAt').reverse().limit(100).toArray()
}

export async function deleteHistory(id: number): Promise<void> {
  await db.history.delete(id)
}