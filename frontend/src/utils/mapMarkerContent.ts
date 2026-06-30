import { formatPriceShort } from './formatPrice'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const tradeTypeLabel = (tradeType?: string | null): string => {
  if (tradeType === 'LEASE' || tradeType === 'JEONSE') return '최근 전세'
  if (tradeType === 'MONTHLY') return '최근 월세'
  return '최근 매매'
}

export const markerContent = (price: number, tradeType?: string | null): string => `
  <div style="
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(-4px);
    cursor: pointer;
    user-select: none;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    filter: drop-shadow(0 3px 7px rgba(15,23,42,0.24));
  ">
    <div style="
      min-width: 58px;
      padding: 3px 8px 4px;
      border-radius: 9px 9px 6px 6px;
      background: #323241;
      color: #ffffff;
      font-size: 10px;
      line-height: 1;
      font-weight: 700;
      text-align: center;
      white-space: nowrap;
      letter-spacing: 0;
    ">
      ${tradeTypeLabel(tradeType)}
    </div>
    <div style="
      position: relative;
      min-width: 64px;
      padding: 6px 9px 7px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.72);
      background: linear-gradient(180deg, #6978F0 0%, #5365DE 100%);
      color: #ffffff;
      font-size: 17px;
      line-height: 1;
      font-weight: 800;
      text-align: center;
      white-space: nowrap;
      letter-spacing: 0;
    ">
      ${formatPriceShort(price)}
      <span style="
        position: absolute;
        left: 50%;
        bottom: -6px;
        width: 12px;
        height: 12px;
        border-right: 1px solid rgba(255,255,255,0.72);
        border-bottom: 1px solid rgba(255,255,255,0.72);
        background: #5365DE;
        transform: translateX(-50%) rotate(45deg);
      "></span>
    </div>
  </div>
`

export const popupMarkerContent = (
  aptName: string,
  price: number,
  tradeType?: string | null
): string => {
  const safeAptName = escapeHtml(aptName)
  const safePrice = price > 0 ? formatPriceShort(price) : ''
  const markerLabel = safePrice ? `${safeAptName} · ${safePrice}` : safeAptName

  return `
  <div style="
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    min-width: 54px;
    cursor: pointer;
    user-select: none;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    filter: drop-shadow(0 3px 7px rgba(15,23,42,0.24));
  ">
    <div
      title="${safeAptName}"
      aria-label="${markerLabel}${safePrice ? ` ${tradeTypeLabel(tradeType)}` : ''}"
      style="
        position: relative;
        width: 30px;
        height: 30px;
      "
    >
      <span style="
        position: absolute;
        left: 50%;
        top: 2px;
        width: 22px;
        height: 22px;
        border-radius: 5px 5px 4px 5px;
        background: #5B6DF1;
        border: 1px solid rgba(255,255,255,0.9);
        transform: translateX(-50%) rotate(45deg);
        box-shadow: 0 1px 0 rgba(255,255,255,0.42) inset;
      "></span>
      <span style="
        position: absolute;
        left: 50%;
        bottom: 1px;
        width: 24px;
        height: 19px;
        border-radius: 7px 7px 8px 8px;
        background: linear-gradient(180deg, #6978F0 0%, #5365DE 100%);
        border: 1px solid rgba(255,255,255,0.92);
        transform: translateX(-50%);
        box-shadow: 0 1px 0 rgba(255,255,255,0.32) inset;
      "></span>
      <span style="
        position: absolute;
        left: 50%;
        bottom: 7px;
        width: 7px;
        height: 8px;
        border-radius: 3px 3px 2px 2px;
        background: rgba(255,255,255,0.92);
        transform: translateX(-50%);
      "></span>
    </div>
    <div style="
      max-width: 98px;
      padding: 4px 7px 5px;
      border-radius: 8px;
      border: 1px solid rgba(226,232,240,0.96);
      background: rgba(255,255,255,0.98);
      color: #1f2937;
      font-size: 10px;
      line-height: 1.18;
      font-weight: 800;
      text-align: center;
      letter-spacing: 0;
    ">
      <div style="
        max-width: 82px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">${safeAptName}</div>
      ${safePrice ? `
        <div style="
          margin-top: 2px;
          color: #5365DE;
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
          white-space: nowrap;
        ">${safePrice}</div>
      ` : ''}
    </div>
  </div>
`
}

export const groupMarkerContent = (label: string, count: number): string => `
  <div style="
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.86);
    background: #31323D;
    color: #ffffff;
    cursor: pointer;
    user-select: none;
    font-family: Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    filter: drop-shadow(0 3px 8px rgba(15,23,42,0.26));
  ">
    <span style="
      max-width: 58px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 0;
    ">${escapeHtml(label)}</span>
    <span style="
      padding: 3px 6px;
      border-radius: 999px;
      background: #5B6DF1;
      font-size: 11px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 0;
    ">${count}개</span>
  </div>
`
