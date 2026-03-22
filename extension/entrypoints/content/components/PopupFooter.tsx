export function PopupFooter() {
  return (
    <div className="flex items-center gap-[8px] border-t border-[hsl(var(--border))] px-[16px] py-[8px]">
      <input
        type="text"
        placeholder="Ask a follow-up..."
        disabled
        className="flex-1 bg-transparent text-[12px] text-[hsl(var(--muted-foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none cursor-not-allowed"
      />
      <span className="text-[12px] text-[hsl(var(--muted-foreground))] cursor-not-allowed">
        GPT-4o mini
      </span>
    </div>
  );
}
