"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Warning, ArrowClockwise } from "@phosphor-icons/react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          className="gp-card"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: 32, margin: "16px 0", gap: 12 }}
        >
          <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 20, background: "#FEE2E2", color: "#B91C1C", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Warning size={30} weight="bold" />
          </span>
          <h3 className="gp-h2" style={{ margin: 0 }}>Algo deu errado neste componente</h3>
          <p className="gp-sub" style={{ margin: 0, maxWidth: 400 }}>
            {this.state.error?.message || "Ocorreu um erro inesperado ao carregar esta seção."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="gp-btn gp-bp"
          >
            <ArrowClockwise size={16} weight="bold" />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
