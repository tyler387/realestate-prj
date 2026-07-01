export const StepIndicator = ({ step }: { step: number }) => (
  <div className="sticky top-14 z-20 flex h-12 items-center justify-center gap-2 border-b border-line-base bg-surface-base py-3">
    {Array.from({ length: 5 }).map((_, i) => {
      const current = i + 1 === step
      const completed = i + 1 < step

      return (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            current
              ? 'bg-brand-600 ring-2 ring-brand-100'
              : completed
                ? 'bg-brand-600'
                : 'bg-slate-200'
          }`}
        />
      )
    })}
    <span className="absolute right-4 text-xs font-semibold text-text-subtle">{step}/5단계</span>
  </div>
)
