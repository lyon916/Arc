import { db, type EnvRecord } from '../db'
import type { KeyValue } from '../types/api'

export async function addEnv(name: string, variables: KeyValue[] = []): Promise<number> {
  return db.environments.add({ name, variables, isActive: false })
}

export async function updateEnv(id: number, data: Partial<Pick<EnvRecord, 'name' | 'variables'>>) {
  return db.environments.update(id, data)
}

export async function deleteEnv(id: number) {
  return db.environments.delete(id)
}

export async function getActiveEnv(): Promise<EnvRecord | undefined> {
  const all = await db.environments.toArray()
  return all.find((e) => e.isActive)
}

export async function getAllEnvs(): Promise<EnvRecord[]> {
  return db.environments.toArray()
}

export async function activateEnv(id: number) {
  await db.environments.filter((e) => e.isActive).modify({ isActive: false })
  await db.environments.update(id, { isActive: true })
}

export { replaceEnvVars } from '../utils/envVars'