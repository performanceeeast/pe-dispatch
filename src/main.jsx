import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, info: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('Dispatch Board Error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: { padding: 40, fontFamily: 'monospace', background: '#fff', minHeight: '100vh' }
      },
        React.createElement('h1', { style: { color: '#c0272d', marginBottom: 16 } }, 'DISPATCH BOARD ERROR'),
        React.createElement('p', { style: { color: '#333', marginBottom: 12 } }, 'Something crashed. Screenshot this and send to Matt:'),
        React.createElement('pre', {
          style: { background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto', color: '#c0272d', fontSize: 13, marginBottom: 16, whiteSpace: 'pre-wrap' }
        }, String(this.state.error)),
        React.createElement('pre', {
          style: { background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto', color: '#666', fontSize: 11, whiteSpace: 'pre-wrap' }
        }, this.state.info?.componentStack || 'No stack trace'),
        React.createElement('button', {
          onClick: () => window.location.reload(),
          style: { marginTop: 20, padding: '10px 24px', background: '#c0272d', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }
        }, 'RELOAD')
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(ErrorBoundary, null,
    React.createElement(App)
  )
)
