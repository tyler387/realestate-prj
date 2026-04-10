export const StepIndicator = ({ step }: { step: number }) => (
  <div className="sticky top-14 z-20 flex h-12 items-center justify-center gap-2 bg-white py-3">
    {Array.from({ length: 5 }).map((_, i) => {
      const current = i + 1 === step
      const completed = i + 1 < step

      return (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            current
              ? 'bg-blue-500 ring-2 ring-blue-200'
              : completed
                ? 'bg-blue-500'
                : 'bg-gray-200'
          }`}
        />
      )
    })}
    <span className="absolute right-4 text-xs text-gray-400">{step}/5단계</span>
  </div>
)
