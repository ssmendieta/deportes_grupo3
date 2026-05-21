import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error no capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Algo sali\u00f3 mal</h2>
          <p>Ocurri\u00f3 un error inesperado. Intenta recargar la p\u00e1gina.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Recargar p\u00e1gina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
