import { useExpandSet } from '../../hooks/useExpandSet'

interface Props {
  data: unknown
  rootKey?: string
}

export function JsonTreeView({ data, rootKey }: Props) {
  const { ids: expanded, toggle } = useExpandSet<string>(['$'])

  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '12px',
      lineHeight: '1.6',
      fontFeatureSettings: '"cv01", "ss03"',
    }}>
      <JsonNode data={data} path="$" keyName={rootKey} expanded={expanded} toggle={toggle} depth={0} />
    </div>
  )
}

interface NodeProps {
  data: unknown
  path: string
  keyName?: string
  expanded: Set<string>
  toggle: (path: string) => void
  depth: number
}

function Row({ indent, onClick, children }: { indent: number; onClick?: () => void; children: React.ReactNode }) {
  return (
    <div
      className="json-row"
      style={{ paddingLeft: indent, ...(onClick ? { cursor: 'pointer' } : {}) }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

function JsonNode({ data, path, keyName, expanded, toggle, depth }: NodeProps) {
  const isExpanded = expanded.has(path)
  const indent = depth * 16

  // null
  if (data === null) {
    return (
      <Row indent={indent}>
        {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
        <span className="json-null">null</span>
      </Row>
    )
  }

  // string
  if (typeof data === 'string') {
    const display = data.length > 200 ? data.slice(0, 200) + '...' : data
    return (
      <Row indent={indent}>
        {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
        <span className="json-string">"{display}"</span>
      </Row>
    )
  }

  // number
  if (typeof data === 'number') {
    return (
      <Row indent={indent}>
        {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
        <span className="json-number">{data}</span>
      </Row>
    )
  }

  // boolean
  if (typeof data === 'boolean') {
    return (
      <Row indent={indent}>
        {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
        <span className="json-bool">{String(data)}</span>
      </Row>
    )
  }

  // array
  if (Array.isArray(data)) {
    if (isExpanded) {
      return (
        <div>
          <Row indent={indent} onClick={() => toggle(path)}>
            <span style={{ fontWeight: 510, marginRight: 4 }}>▾</span>
            {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
            <span className="json-bracket">[</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{data.length} items</span>
          </Row>
          {data.map((item, i) => (
            <JsonNode
              key={i}
              data={item}
              path={`${path}.${i}`}
              keyName={`${i}`}
              expanded={expanded}
              toggle={toggle}
              depth={depth + 1}
            />
          ))}
          <Row indent={indent}>
            <span className="json-bracket">]</span>
          </Row>
        </div>
      )
    }

    // collapsed
    const preview = arrayPreview(data)
    return (
      <Row indent={indent} onClick={() => toggle(path)}>
        <span style={{ fontWeight: 510, marginRight: 4 }}>▸</span>
        {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
        <span className="json-bracket">[</span>
        <span style={{ color: 'var(--text-muted)' }}> {preview} </span>
        <span className="json-bracket">]</span>
      </Row>
    )
  }

  // object
  if (typeof data === 'object') {
    const entries = Object.entries(data as Record<string, unknown>)

    if (isExpanded) {
      return (
        <div>
          <Row indent={indent} onClick={() => toggle(path)}>
            <span style={{ fontWeight: 510, marginRight: 4 }}>▾</span>
            {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
            <span className="json-bracket">{"{"}</span>
          </Row>
          {entries.map(([k, v]) => (
            <JsonNode
              key={k}
              data={v}
              path={`${path}.${k}`}
              keyName={k}
              expanded={expanded}
              toggle={toggle}
              depth={depth + 1}
            />
          ))}
          <Row indent={indent}>
            <span className="json-bracket">{"}"}</span>
          </Row>
        </div>
      )
    }

    // collapsed
    const preview = objectPreview(entries)
    return (
      <Row indent={indent} onClick={() => toggle(path)}>
        <span style={{ fontWeight: 510, marginRight: 4 }}>▸</span>
        {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
        <span className="json-bracket">{"{"}</span>
        <span style={{ color: 'var(--text-muted)' }}> {preview} </span>
        <span className="json-bracket">{"}"}</span>
      </Row>
    )
  }

  // fallback
  return (
    <Row indent={indent}>
      {keyName !== undefined && <><span className="json-key">{keyName}</span><span className="json-bracket">: </span></>}
      <span>{String(data)}</span>
    </Row>
  )
}

function objectPreview(entries: [string, unknown][]): string {
  const max = 5
  const items = entries.slice(0, max).map(([k, v]) => {
    const val = valuePreview(v)
    return `${k}: ${val}`
  })
  const extra = entries.length > max ? `, ...${entries.length - max} more` : ''
  return items.join(', ') + extra
}

function valuePreview(v: unknown): string {
  if (v === null) return 'null'
  if (typeof v === 'string') return `"${v.slice(0, 20)}"`
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (Array.isArray(v)) return `Array(${v.length})`
  if (typeof v === 'object') return 'Object'
  return String(v)
}

function arrayPreview(data: unknown[]): string {
  const max = 3
  const items = data.slice(0, max).map(valuePreview)
  const extra = data.length > max ? `, ...${data.length - max} more` : ''
  return items.join(', ') + extra
}