interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon = "📦", title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-4xl mb-4">{icon}</span>
      <h3 className="text-base font-semibold mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-[260px] mb-4">{message}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent/90 active:scale-[0.97] transition-all min-h-0"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium bg-accent text-white rounded-xl hover:bg-accent/90 active:scale-[0.97] transition-all min-h-0"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
