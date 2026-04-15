import { formatPriceShort } from './formatPrice'

export const markerContent = (price: number): string => `
  <div style="
    background: white;
    border: 1.5px solid #3B82F6;
    border-radius: 12px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 600;
    color: #1e40af;
    white-space: nowrap;
    cursor: pointer;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  ">
    ${formatPriceShort(price)}
  </div>
`
