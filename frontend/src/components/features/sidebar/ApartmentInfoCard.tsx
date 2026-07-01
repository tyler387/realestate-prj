import { useNavigate } from 'react-router-dom'
import { useApartmentSummary } from '../../../hooks/useSidebarData'
import { formatPrice } from '../../../utils/formatPrice'
import { SidebarCard, CardTitle } from './SidebarCard'
import { ApartmentInfoCardSkeleton, ErrorMessage, SidebarEmptyState } from './SidebarSkeleton'

const KpiItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-line-base bg-surface-soft px-2.5 py-2">
    <p className="text-[10px] font-medium text-text-muted lg:text-[11px]">{label}</p>
    <p className="mt-1 text-[11px] font-bold text-text-strong lg:text-xs">{value}</p>
  </div>
)

export const ApartmentInfoCard = ({ aptId }: { aptId: string }) => {
  const { data, isLoading, isError } = useApartmentSummary(aptId)
  const navigate = useNavigate()

  const currentYear = new Date().getFullYear()
  const isNewApartment = !!data?.builtYear && data.builtYear > 0 && currentYear - data.builtYear <= 10
  const isLargeComplex = !!data?.households && data.households >= 1000
  const isActiveTrading = !!data?.recent30dTradeCount && data.recent30dTradeCount >= 3

  const pyeong = data?.recentSaleArea != null ? Math.round(data.recentSaleArea / 3.30579) : null
  const pricePerPyeong = data?.recentPrice && pyeong && pyeong > 0 ? Math.round(data.recentPrice / pyeong) : null
  const recentTradeDateLabel = data?.recentTradeDate
    ? data.recentTradeDate.replaceAll('-', '.')
    : '집계 준비중'

  return (
    <SidebarCard className="min-h-[220px] p-4 lg:p-5">
      <CardTitle>지역 정보</CardTitle>

      {!aptId && <SidebarEmptyState text="아파트를 선택하면 지역 정보가 표시됩니다" />}
      {isLoading && <ApartmentInfoCardSkeleton />}
      {isError && <ErrorMessage text="아파트 정보를 불러올 수 없습니다" />}

      {data && (
        <div className="flex h-full flex-col">
          <div>
            <p
              className="text-sm font-bold leading-5 text-text-strong lg:text-base"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {data.aptName}
            </p>
          </div>

          <p className="mt-1 text-[11px] text-text-muted lg:text-xs">{data.location}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {isNewApartment && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                신축
              </span>
            )}
            {isLargeComplex && (
              <span className="rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                대단지
              </span>
            )}
            {isActiveTrading && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                실거래활발
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <KpiItem
              label="세대수"
              value={data.households > 0 ? `${data.households.toLocaleString()}세대` : '집계 준비중'}
            />
            <KpiItem
              label="준공연도"
              value={data.builtYear > 0 ? `${data.builtYear}년` : '집계 준비중'}
            />
            <KpiItem
              label="최근 실거래가"
              value={data.recentPrice > 0 ? formatPrice(data.recentPrice) : '집계 준비중'}
            />
            <KpiItem label="전용면적(평)" value={pyeong != null ? `${pyeong}평` : '집계 준비중'} />
            <KpiItem
              label="추정 평당가"
              value={pricePerPyeong != null ? formatPrice(pricePerPyeong) : '집계 준비중'}
            />
            <KpiItem
              label="데이터 기준"
              value={recentTradeDateLabel}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate(`/trade/apartment/${data.aptId}`)}
              className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-[11px] font-bold text-brand-700 transition-colors hover:bg-brand-100 lg:text-xs"
            >
              실거래 상세 보기
            </button>
            <button
              type="button"
              onClick={() => navigate('/write')}
              className="rounded-lg border border-line-base bg-surface-base px-3 py-2 text-[11px] font-bold text-text-body transition-colors hover:bg-surface-soft lg:text-xs"
            >
              이 아파트 글쓰기
            </button>
          </div>
        </div>
      )}
    </SidebarCard>
  )
}
