import { type TradeApartment as Apartment } from '../../../types/trade'
import { formatPrice } from '../../../utils/formatPrice'

type Props = {
  apartment: Apartment
  latestPrice: number
  priceChangeRate: number
  isFavorite: boolean
  onFavoriteToggle: () => void
}

export const ApartmentHeader = ({ apartment, latestPrice, priceChangeRate, isFavorite, onFavoriteToggle }: Props) => (
  <div className="mx-4 mt-3 rounded-xl border border-line-base bg-surface-base p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className="mb-2 inline-flex rounded-full border border-brand-100 bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700">
          실거래 상세
        </span>
        <p className="truncate text-2xl font-black tracking-tight text-text-strong">{apartment.apartmentName}</p>
        <p className="mt-1 truncate text-sm font-medium text-text-muted">{apartment.address}</p>
      </div>
      <button
        className="flex h-10 shrink-0 items-center gap-1 rounded-full border border-line-base bg-surface-base px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-soft"
        onClick={onFavoriteToggle}
      >
        <span className={isFavorite ? 'text-market-warning' : 'text-text-subtle'}>{isFavorite ? '★' : '☆'}</span>
        <span>관심</span>
      </button>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-base pt-4">
      <div>
        <p className="text-xs font-semibold text-text-subtle">최근 실거래가</p>
        <p className="mt-1 text-2xl font-black text-text-strong tabular-nums">{formatPrice(latestPrice)}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-text-subtle">전월 대비</p>
        <p className={`mt-1 text-base font-black tabular-nums ${
          priceChangeRate > 0 ? 'text-market-sale' : priceChangeRate < 0 ? 'text-market-jeonse' : 'text-text-muted'
        }`}
        >
          {priceChangeRate > 0
            ? `+${priceChangeRate.toFixed(1)}%`
            : priceChangeRate < 0
              ? `-${Math.abs(priceChangeRate).toFixed(1)}%`
              : '변동 없음'}
        </p>
      </div>
    </div>
  </div>
)
