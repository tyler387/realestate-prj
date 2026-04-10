type StepNavigationProps = {
  currentStep: number
  canProceed: boolean
  onPrev: () => void
  onNext: () => void
}

export const StepNavigation = ({ currentStep, canProceed, onPrev, onNext }: StepNavigationProps) => {
  if (currentStep === 5) return null

  return (
    <div className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-3xl -translate-x-1/2 gap-3 border-t border-gray-100 bg-white px-4 py-3">
      {currentStep > 1 && (
        <button
          onClick={onPrev}
          className="h-12 w-1/3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
        >
          이전
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="h-12 flex-1 rounded-xl bg-blue-500 text-sm font-semibold text-white disabled:pointer-events-none disabled:bg-gray-200 disabled:text-gray-400"
      >
        다음
      </button>
    </div>
  )
}
