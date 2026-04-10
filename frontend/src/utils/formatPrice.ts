export const formatPrice = (priceInManwon: number): string => {
  if (priceInManwon <= 0) return '정보 없음'

  const eok = Math.floor(priceInManwon / 10000)
  const man = priceInManwon % 10000

  if (eok > 0 && man > 0) return `${eok}억 ${man.toLocaleString()}만`
  if (eok > 0) return `${eok}억`
  return `${man.toLocaleString()}만`
}

export const formatPriceShort = (priceInManwon: number): string => {
  if (priceInManwon <= 0) return '-'
  const eok = Math.floor(priceInManwon / 10000)
  const man = Math.round((priceInManwon % 10000) / 1000)
  if (eok > 0 && man > 0) return `${eok}.${man}억`
  if (eok > 0) return `${eok}억`
  return `${priceInManwon / 1000}천만`
}
