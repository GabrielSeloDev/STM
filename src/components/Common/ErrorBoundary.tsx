import { Component, ErrorInfo, ReactNode } from 'react'
import './ErrorBoundary.css'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary] Erro capturado:', error)
        console.error('[ErrorBoundary] Info:', errorInfo)

        this.setState({
            error,
            errorInfo
        })
    }

    handleReload = () => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <div className="error-icon">⚠️</div>
                        <h1>Algo deu errado</h1>
                        <p className="error-message">
                            A aplicação encontrou um erro inesperado.
                        </p>

                        {this.state.error && (
                            <details className="error-details">
                                <summary>Detalhes do erro</summary>
                                <pre className="error-stack">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <button className="error-reload-btn" onClick={this.handleReload}>
                            Recarregar Aplicação
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
