"use client";

import { Component, ReactNode } from "react";
import { useTranslations } from "next-intl";

interface MapErrorBoundaryLabels {
  title: string;
  defaultMessage: string;
  tryAgain: string;
  goHome: string;
  technicalDetails: string;
  noStackTrace: string;
}

interface MapErrorBoundaryClassProps extends MapErrorBoundaryLabels {
  children: ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Class component holding the error-boundary lifecycle
 * (getDerivedStateFromError, componentDidCatch) — hooks like useTranslations
 * can't run here, so the translated copy arrives as props from the
 * MapErrorBoundary wrapper below.
 */
class MapErrorBoundaryClass extends Component<
  MapErrorBoundaryClassProps,
  MapErrorBoundaryState
> {
  constructor(props: MapErrorBoundaryClassProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error("Map Error Boundary caught an error:", error, errorInfo);

    // Here you could send error to an error reporting service
    // Example: errorReportingService.log(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-zinc-100 dark:bg-zinc-900">
          <div className="max-w-md p-8 bg-white dark:bg-zinc-800 rounded-lg shadow-lg text-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {this.props.title}
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              {this.state.error?.message || this.props.defaultMessage}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                {this.props.tryAgain}
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                className="w-full px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors font-medium"
              >
                {this.props.goHome}
              </button>
            </div>

            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
                {this.props.technicalDetails}
              </summary>
              <pre className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-900 rounded text-xs overflow-auto text-zinc-800 dark:text-zinc-200">
                {this.state.error?.stack || this.props.noStackTrace}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface MapErrorBoundaryProps {
  children: ReactNode;
}

/**
 * MapErrorBoundary component - Error boundary for map-related errors
 *
 * This component catches JavaScript errors anywhere in the map component tree
 * and displays a fallback UI instead of crashing the entire application.
 *
 * Features:
 * - Catches and handles errors in map components
 * - Displays user-friendly error messages
 * - Provides reset functionality
 * - Logs errors for debugging
 * - Prevents app crashes from map failures
 *
 * Common Error Scenarios:
 * - Missing Leaflet library
 * - Invalid map configuration
 * - Tile loading failures
 * - Marker rendering errors
 * - Network connectivity issues
 *
 * @example
 * ```tsx
 * <MapErrorBoundary>
 *   <MapProvider>
 *     <LeafletMap>
 *       <LeafletTileLayer url={tileUrl} />
 *     </LeafletMap>
 *   </MapProvider>
 * </MapErrorBoundary>
 * ```
 */
export function MapErrorBoundary({ children }: MapErrorBoundaryProps) {
  const t = useTranslations("geography.errorBoundary");

  return (
    <MapErrorBoundaryClass
      title={t("title")}
      defaultMessage={t("defaultMessage")}
      tryAgain={t("tryAgain")}
      goHome={t("goHome")}
      technicalDetails={t("technicalDetails")}
      noStackTrace={t("noStackTrace")}
    >
      {children}
    </MapErrorBoundaryClass>
  );
}
