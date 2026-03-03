import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  declare props: Readonly<AppErrorBoundaryProps>;

  state: AppErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <h1 className="text-xl font-black mb-2">Erro inesperado</h1>
            <p className="text-sm text-slate-300 mb-5">
              Encontramos uma falha na interface. Recarregue para continuar.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all font-bold"
            >
              Recarregar app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
