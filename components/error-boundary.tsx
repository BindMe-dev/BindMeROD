"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { reportError } from "@/lib/monitoring-service"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report error to monitoring service
    reportError({
      error,
      context: {
        componentStack: errorInfo.componentStack,
      },
      severity: "high",
    })

    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <Card className="bg-slate-900/80 border-red-500/30 max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-6 h-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-300">
                We're sorry, but something unexpected happened. The error has been reported to our team.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-slate-800 p-3 rounded-lg text-xs font-mono overflow-auto max-h-40">
                  <p className="text-red-400">{this.state.error.message}</p>
                  <pre className="text-slate-400 mt-2 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button
                  onClick={() => (window.location.href = "/")}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based error boundary for functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      reportError({
        error,
        severity: "medium",
      })
    }
  }, [error])

  return setError
}

