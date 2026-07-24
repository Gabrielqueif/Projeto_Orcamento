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
        <div className="flex flex-col items-center justify-center p-8 bg-color-bg-soft rounded-xl border border-color-border my-4 text-center">
          <div className="w-12 h-12 rounded-full bg-color-danger-bg flex items-center justify-center mb-3">
            <Warning size={24} className="text-color-danger" />
          </div>
          <h3 className="text-[16px] font-bold text-color-heading mb-1">
            Algo deu errado neste componente
          </h3>
          <p className="text-[12px] text-color-text-muted max-w-[400px] mb-4">
            {this.state.error?.message || "Ocorreu um erro inesperado ao carregar esta seção."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-color-primary-dark text-white rounded-lg text-[12px] font-semibold hover:opacity-90 transition-all cursor-pointer border-none"
          >
            <ArrowClockwise size={14} />
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
