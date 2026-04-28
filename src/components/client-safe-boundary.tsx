"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type ClientSafeBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage: string;
};

type ClientSafeBoundaryState = {
  hasError: boolean;
};

export class ClientSafeBoundary extends Component<ClientSafeBoundaryProps, ClientSafeBoundaryState> {
  state: ClientSafeBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[wsa-client-boundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel stack">
          <div>
            <p className="eyebrow">Dashboard note</p>
            <h3>{this.props.fallbackTitle ?? "This section needs a refresh"}</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            {this.props.fallbackMessage}
          </p>
        </section>
      );
    }

    return this.props.children;
  }
}
