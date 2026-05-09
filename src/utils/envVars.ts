import type { KeyValue } from '../types/api'

/** 将字符串中的 {{varName}} 替换为 variables 中对应的 value */
export function replaceEnvVars(str: string, variables: KeyValue[]): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const kv = variables.find((v) => v.key === key && v.enabled)
    return kv ? kv.value : ''
  })
}
