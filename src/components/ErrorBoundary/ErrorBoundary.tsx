import "./ErrorBoundary.css";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorMessage } from "./ErrorMessage";

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

    return <ErrorMessage />;
  }
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}
