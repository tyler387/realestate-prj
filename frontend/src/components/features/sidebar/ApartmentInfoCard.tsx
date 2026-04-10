import { useApartmentSummary } from '../../../hooks/useSidebarData'
import { formatPrice } from '../../../utils/formatPrice'
import { SidebarCard, CardTitle, InfoRow } from './SidebarCard'
import { ApartmentInfoCardSkeleton, ErrorMessage } from './SidebarSkeleton'

export const ApartmentInfoCard = ({ aptId }: { aptId: string }) => {
  const { data, isLoading, isError } = useApartmentSummary(aptId)

  return (
    <SidebarCard>
      <CardTitle>지역 정보</CardTitle>
      {isLoading && <ApartmentInfoCardSkeleton />}
      {isError && <ErrorMessage text="아파트 정보를 불러올 수 없습니다" />}
      {data && (
        <>
          <p className="text-base font-bold text-gray-900">🏢 {data.aptName}</p>
          <p className="mt-0.5 text-xs text-gray-500">{data.location}</p>
          <div className="mt-3">
            <InfoRow label="세대수"      value={`${data.households.toLocaleString()}세대`} />
            <InfoRow label="준공년도"    value={`${data.builtYear}년`} />
            <InfoRow label="최근 실거래" value={formatPrice(data.recentPrice)} />
          </div>
        </>
      )}
    </SidebarCard>
  )
}
