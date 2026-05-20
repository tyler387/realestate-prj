import { useMemo, useState } from 'react'
import { useTradeFilterStore } from '../../../stores/tradeFilterStore'
import { useUiStore } from '../../../stores/uiStore'
import {
  useCreateSavedTradeFilter,
  useDeleteSavedTradeFilter,
  useSavedTradeFilters,
  useUpdateSavedTradeFilter,
} from '../../../hooks/useSavedTradeFilters'
import { useUserStore } from '../../../stores/userStore'
import { SidebarCard, CardTitle } from '../sidebar/SidebarCard'
import { FilterGroup } from './FilterGroup'
import { FilterChip } from './FilterChip'

type SavedPayload = {
  priceRange: 'UNDER_10' | '10_20' | 'OVER_20' | null
  dealType: 'SALE' | 'JEONSE' | 'MONTHLY' | null
  areaRange: '20' | '30' | '40' | null
  preset: 'NEW' | 'LARGE' | 'HOT' | null
  floorBand: 'LOW' | 'MID' | 'HIGH' | null
  yearBand: 'NEW_0_10' | 'MID_11_20' | 'OLD_21_PLUS' | null
  complexKeyword: string | null
  excludeOutliers: boolean
  tradePeriod: '1m' | '3m' | '6m' | '12m' | 'custom'
  tradeCustomStartDate: string | null
  tradeCustomEndDate: string | null
}

const PRESET_OPTIONS = [
  { label: '신축', value: 'NEW' as const },
  { label: '대단지', value: 'LARGE' as const },
  { label: '최근거래많음', value: 'HOT' as const },
]

const PRICE_RANGE_OPTIONS = [
  { label: '10억 이하', value: 'UNDER_10' as const },
  { label: '10억~20억', value: '10_20' as const },
  { label: '20억 이상', value: 'OVER_20' as const },
]

const DEAL_TYPE_OPTIONS = [
  { label: '매매', value: 'SALE' as const },
  { label: '전세', value: 'JEONSE' as const },
  { label: '월세', value: 'MONTHLY' as const },
]

const AREA_RANGE_OPTIONS = [
  { label: '20평대', value: '20' as const },
  { label: '30평대', value: '30' as const },
  { label: '40평대', value: '40' as const },
]

const FLOOR_BAND_OPTIONS = [
  { label: '저층(1~5층)', value: 'LOW' as const },
  { label: '중층(6~15층)', value: 'MID' as const },
  { label: '고층(16층+)', value: 'HIGH' as const },
]

const YEAR_BAND_OPTIONS = [
  { label: '신축(0~10년)', value: 'NEW_0_10' as const },
  { label: '준신축(11~20년)', value: 'MID_11_20' as const },
  { label: '구축(21년+)', value: 'OLD_21_PLUS' as const },
]

export const QuickFilters = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showOutlierTooltip, setShowOutlierTooltip] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [selectedSavedId, setSelectedSavedId] = useState<number | null>(null)
  const status = useUserStore((s) => s.status)

  const {
    priceRange,
    dealType,
    areaRange,
    preset,
    floorBand,
    yearBand,
    complexKeyword,
    excludeOutliers,
    resultCount,
    setPriceRange,
    setDealType,
    setAreaRange,
    setPreset,
    setFloorBand,
    setYearBand,
    setComplexKeyword,
    setExcludeOutliers,
    resetFilters,
  } = useTradeFilterStore()

  const {
    tradePeriod,
    setTradePeriod,
    tradeCustomStartDate,
    tradeCustomEndDate,
    setTradeCustomDateRange,
  } = useUiStore()

  const savedFiltersQuery = useSavedTradeFilters(status !== 'GUEST')
  const createSaved = useCreateSavedTradeFilter()
  const updateSaved = useUpdateSavedTradeFilter()
  const deleteSaved = useDeleteSavedTradeFilter()

  const activeCount = useMemo(() => {
    let count = 0
    if (preset) count += 1
    if (priceRange) count += 1
    if (dealType) count += 1
    if (areaRange) count += 1
    if (excludeOutliers) count += 1
    if (floorBand) count += 1
    if (yearBand) count += 1
    if (complexKeyword) count += 1
    return count
  }, [preset, priceRange, dealType, areaRange, excludeOutliers, floorBand, yearBand, complexKeyword])

  const payload: SavedPayload = {
    priceRange,
    dealType,
    areaRange,
    preset,
    floorBand,
    yearBand,
    complexKeyword,
    excludeOutliers,
    tradePeriod,
    tradeCustomStartDate,
    tradeCustomEndDate,
  }

  const applySavedPayload = (data: SavedPayload) => {
    setPriceRange(data.priceRange)
    setDealType(data.dealType)
    setAreaRange(data.areaRange)
    setPreset(data.preset)
    setFloorBand(data.floorBand)
    setYearBand(data.yearBand)
    setComplexKeyword(data.complexKeyword)
    setExcludeOutliers(Boolean(data.excludeOutliers))
    setTradePeriod(data.tradePeriod)
    setTradeCustomDateRange(data.tradeCustomStartDate, data.tradeCustomEndDate)
  }

  const handleCreate = async () => {
    const name = saveName.trim()
    if (!name) return
    await createSaved.mutateAsync({ name, payload: JSON.stringify(payload) })
    setSaveName('')
  }

  const handleUpdate = async () => {
    const name = saveName.trim()
    if (!name || selectedSavedId == null) return
    await updateSaved.mutateAsync({ id: selectedSavedId, name, payload: JSON.stringify(payload) })
  }

  const handleDelete = async (id: number) => {
    await deleteSaved.mutateAsync(id)
    if (selectedSavedId === id) setSelectedSavedId(null)
  }

  return (
    <SidebarCard>
      <div className="mb-3 flex items-center justify-between">
        <CardTitle>빠른 필터</CardTitle>
        <button
          type="button"
          onClick={() => setIsExpanded((v) => !v)}
          className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-700"
        >
          {isExpanded ? '상세 접기' : '상세 보기'}
        </button>
      </div>

      <FilterGroup label="프리셋">
        {PRESET_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.value}
            label={opt.label}
            isSelected={preset === opt.value}
            onClick={() => setPreset(preset === opt.value ? null : opt.value)}
          />
        ))}
      </FilterGroup>

      {isExpanded && (
        <>
          <FilterGroup label="가격대">
            {PRICE_RANGE_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={priceRange === opt.value}
                onClick={() => setPriceRange(priceRange === opt.value ? null : opt.value)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="거래유형">
            {DEAL_TYPE_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={dealType === opt.value}
                onClick={() => setDealType(dealType === opt.value ? null : opt.value)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="면적">
            {AREA_RANGE_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={areaRange === opt.value}
                onClick={() => setAreaRange(areaRange === opt.value ? null : opt.value)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="층수">
            {FLOOR_BAND_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={floorBand === opt.value}
                onClick={() => setFloorBand(floorBand === opt.value ? null : opt.value)}
              />
            ))}
          </FilterGroup>

          <FilterGroup label="연차">
            {YEAR_BAND_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                isSelected={yearBand === opt.value}
                onClick={() => setYearBand(yearBand === opt.value ? null : opt.value)}
              />
            ))}
          </FilterGroup>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-gray-500">단지명 키워드</p>
            <input
              type="text"
              value={complexKeyword ?? ''}
              onChange={(e) => setComplexKeyword(e.target.value.trim() === '' ? null : e.target.value.trim())}
              placeholder="예: 래미안, 자이"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700"
            />
          </div>

          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2">
            <label className="flex cursor-pointer items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-medium text-gray-700">
                이상치 제외
                <button
                  type="button"
                  aria-label="이상치 제외 기준 보기"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] text-gray-500"
                  onMouseEnter={() => setShowOutlierTooltip(true)}
                  onMouseLeave={() => setShowOutlierTooltip(false)}
                  onFocus={() => setShowOutlierTooltip(true)}
                  onBlur={() => setShowOutlierTooltip(false)}
                >
                  i
                </button>
              </span>
              <input
                type="checkbox"
                checked={excludeOutliers}
                onChange={(e) => setExcludeOutliers(e.target.checked)}
                className="h-4 w-4 accent-blue-500"
              />
            </label>
            <p className="mt-1 text-[11px] text-gray-500">특수거래/비정상 단가 의심 건 제외</p>
            {showOutlierTooltip && (
              <div className="mt-2 rounded-md border border-gray-200 bg-white p-2 text-[11px] leading-4 text-gray-600 shadow-sm">
                제외 기준: 특수관계 추정 거래, 단가 0 또는 비정상 값, 취소/정정 의심 패턴
              </div>
            )}
          </div>

          {status !== 'GUEST' && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-2">
              <p className="mb-1.5 text-xs font-medium text-gray-700">저장 필터</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="필터 이름"
                  className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-md bg-blue-500 px-2 py-1.5 text-xs font-semibold text-white"
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={selectedSavedId == null}
                  className="rounded-md border border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-700 disabled:opacity-50"
                >
                  수정
                </button>
              </div>

              <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">
                {savedFiltersQuery.data?.map((item) => (
                  <div key={item.id} className="flex items-center gap-1 rounded-md border border-gray-100 px-2 py-1.5">
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-xs text-gray-700"
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(item.payload) as SavedPayload
                          applySavedPayload(parsed)
                          setSelectedSavedId(item.id)
                          setSaveName(item.name)
                        } catch {
                          // invalid payload
                        }
                      }}
                    >
                      {item.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-[11px] text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                {!savedFiltersQuery.isLoading && (savedFiltersQuery.data?.length ?? 0) === 0 && (
                  <p className="text-[11px] text-gray-400">저장된 필터가 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="sticky bottom-0 mt-4 border-t border-gray-100 bg-white pt-3">
        <p className="text-xs text-gray-500">
          현재 조건 <span className="font-semibold text-gray-800">{resultCount ?? '-'}건</span>
          <span className="ml-2 text-gray-400">적용 필터 {activeCount}개</span>
        </p>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white"
          >
            적용
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600"
          >
            초기화
          </button>
        </div>
      </div>
    </SidebarCard>
  )
}
