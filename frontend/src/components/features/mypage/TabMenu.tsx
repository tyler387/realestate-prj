type Tab = '내 게시글' | '내 댓글'

export const TabMenu = ({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) => (
  <div className="sticky top-0 z-10 mx-4 mt-3 flex rounded-xl border border-line-base bg-surface-base p-1">
    {(['내 게시글', '내 댓글'] as Tab[]).map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`h-10 flex-1 rounded-lg text-sm font-semibold transition-colors ${
          active === tab ? 'bg-brand-600 text-white shadow-panel' : 'text-text-muted hover:bg-surface-soft'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
)
