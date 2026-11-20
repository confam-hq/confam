import { Component, type ErrorInfo, type ReactNode } from "react";
import StatusPage from "../../pages/StatusPage";

export default class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Confam application rendering error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) return <StatusPage code="500" />;
    return this.props.children;
  }
}
