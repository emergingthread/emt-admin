type LoadingIndicatorProps = {
  label?: string;
};

export default function LoadingIndicator({ label = "Loading" }: LoadingIndicatorProps) {
  return <div className="loading-indicator" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" />{label}</div>;
}
