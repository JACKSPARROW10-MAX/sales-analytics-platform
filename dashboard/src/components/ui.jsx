// src/components/ui.jsx
// Shared presentation primitives for consistent loading / error / empty states.
import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

export const Skeleton = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const Spinner = ({ label = 'Loading…' }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex items-center justify-center gap-2 h-56 text-sm text-[#64748B]"
  >
    <RefreshCw className="w-4 h-4 animate-spin" />
    {label}
  </div>
);

/**
 * One component for the three non-happy states every data view needs.
 * status: 'loading' | 'error' | 'empty'
 */
export const StateView = ({
  status,
  title,
  message,
  onRetry,
  icon: Icon,
  className = '',
}) => {
  if (status === 'loading') return <Spinner label={message || 'Loading…'} />;

  const isError = status === 'error';
  const FallbackIcon = Icon || (isError ? AlertTriangle : Inbox);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-14 px-6 text-center ${className}`}
      role={isError ? 'alert' : 'status'}
    >
      <div
        className={`p-3 rounded-full ${
          isError
            ? 'bg-red-50 text-[#DC2626] dark:bg-red-950/40'
            : 'bg-[#F1F5F9] text-[#64748B] dark:bg-[#1E293B]'
        }`}
      >
        <FallbackIcon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
          {title || (isError ? 'Something went wrong' : 'No data yet')}
        </p>
        {message && (
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm">
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Try again
        </button>
      )}
    </div>
  );
};

/** Card section wrapper with an optional title row. */
export const Panel = ({ title, subtitle, icon: Icon, action, children, className = '' }) => (
  <section className={`fintech-card ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div>
          {title && (
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-[#E2E8F0] flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-[#2563EB]" />}
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

/** Small status pill. tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' */
export const Badge = ({ tone = 'neutral', children, className = '' }) => {
  const tones = {
    neutral: 'bg-[#F1F5F9] text-[#475569] dark:bg-[#1E293B] dark:text-[#94A3B8]',
    success: 'bg-green-50 text-[#16A34A] dark:bg-green-950/40 dark:text-green-400',
    warning: 'bg-amber-50 text-[#B45309] dark:bg-amber-950/40 dark:text-amber-400',
    danger: 'bg-red-50 text-[#DC2626] dark:bg-red-950/40 dark:text-red-400',
    info: 'bg-[#EFF6FF] text-[#2563EB] dark:bg-[#1E293B] dark:text-[#60A5FA]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
};

/** App-wide error boundary so a render crash never shows a blank screen. */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('UI ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC] dark:bg-[#0B1120]">
          <div className="fintech-card p-8 max-w-md text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-[#DC2626] mx-auto" />
            <h1 className="text-base font-semibold text-[#0F172A] dark:text-[#E2E8F0]">
              The dashboard hit an unexpected error
            </h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Reload the page to continue. If it keeps happening, check that the API is reachable.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary mx-auto"
            >
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
