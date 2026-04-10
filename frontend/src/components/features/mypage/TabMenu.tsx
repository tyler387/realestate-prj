type Tab = '내 게시글' | '내 댓글'

export const TabMenu = ({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) => (
  <div className="sticky top-0 z-10 flex border-b border-gray-200 bg-white">
    {(['내 게시글', '내 댓글'] as Tab[]).map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`flex-1 py-3 text-sm font-medium transition-colors ${
          active === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-400'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
)
