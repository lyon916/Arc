import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
  errorInfo: ErrorInfo | null
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null, errorInfo: null, hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })
    console.error('[Arc] Caught error:', error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ error: null, errorInfo: null, hasError: false })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '16px',
            padding: '24px',
            background: 'var(--bg-canvas)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-primary)',
          }}
        >
          <div style={{ fontSize: '64px' }}>💥</div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: 0 }}>
            应用出现错误
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '480px', margin: 0 }}>
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-standard)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'var(--font-primary)',
              }}
            >
              刷新页面
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--accent-brand)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: 'var(--font-primary)',
              }}
            >
              重试
            </button>
          </div>
          {this.state.errorInfo && (
            <details style={{ marginTop: '16px', maxWidth: '640px', width: '100%' }}>
              <summary style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                查看错误详情
              </summary>
              <pre
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  overflow: 'auto',
                  maxHeight: '300px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {this.state.error?.stack}
                {'\n\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
