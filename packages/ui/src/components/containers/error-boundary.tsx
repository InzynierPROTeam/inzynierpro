import { Component, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback: (error: Error, reset: () => void) => ReactNode
  onReset: () => void
}

type State = { failed: false } | { failed: true; error: Error }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false }

  static getDerivedStateFromError(error: Error): State {
    return { failed: true, error }
  }

  reset = () => {
    this.props.onReset()
    this.setState({ failed: false })
  }

  override render() {
    return this.state.failed
      ? this.props.fallback(this.state.error, this.reset)
      : this.props.children
  }
}
