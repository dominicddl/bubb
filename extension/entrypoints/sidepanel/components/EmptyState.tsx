interface EmptyStateProps {
  heading: string;
  body: string;
}

export function EmptyState({ heading, body }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-7 text-center">
      <p
        className="text-[13px] font-semibold mb-2"
        style={{
          fontFamily: 'var(--font-sans)',
          color: 'hsl(24 10% 16%)',
        }}
      >
        {heading}
      </p>
      <p
        className="text-[11px] leading-[1.6]"
        style={{
          fontFamily: 'var(--font-sans)',
          color: 'hsl(var(--muted-foreground))',
        }}
      >
        {body}
      </p>
    </div>
  );
}
