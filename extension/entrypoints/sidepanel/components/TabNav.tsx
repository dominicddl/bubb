import { useSidePanelStore } from '../stores/sidePanelStore';

export function TabNav() {
  const activeTab = useSidePanelStore((s) => s.activeTab);
  const setActiveTab = useSidePanelStore((s) => s.setActiveTab);

  const tabs = [
    { value: 'this-page' as const, label: 'This Page' },
    { value: 'continue-learning' as const, label: 'Continue Learning' },
  ];

  return (
    <div
      className="flex shrink-0"
      style={{
        height: '40px',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className="relative flex items-center justify-center flex-1 text-[12px] font-medium transition-colors"
            style={{
              fontFamily: 'var(--font-sans)',
              color: isActive ? 'hsl(24 10% 12%)' : 'hsl(24 5% 52%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
            {/* Active indicator: 2px bottom border in accent-green */}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0"
                style={{
                  height: '2px',
                  background: 'hsl(var(--accent-green))',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
