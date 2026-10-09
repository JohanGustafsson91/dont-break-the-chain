import "./ErrorBoundary.css";
import { Component, type ErrorInfo, type ReactNode } from "react";

// A class is still the only way to catch render errors in React.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unexpected error", { error, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="page page-center ErrorBoundary" role="alert">
        <h1>Something went wrong</h1>
        <p>Your habits are safe. Reloading the page usually fixes it.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}
