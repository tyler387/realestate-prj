export const formatPrice = (priceInManwon: number): string => {
  // 만원 단위를 억 단위 + 나머지로 분리한다.
  const eok = Math.floor(priceInManwon / 10000)
  const rest = priceInManwon % 10000

  if (eok === 0) {
    return `${priceInManwon.toLocaleString()}만`
  }

  if (rest === 0) {
    return `${eok}억`
  }

  const thousand = Math.floor(rest / 1000)
  const hundred = Math.floor((rest % 1000) / 100)
  const ten = rest % 100

  // 9억 5천 5백만 형태처럼 0이 아닌 단위만 조합한다.
  const parts: string[] = []

  if (thousand > 0) {
    parts.push(`${thousand}천`)
  }

  if (hundred > 0) {
    parts.push(`${hundred}백`)
  }

  if (ten > 0) {
    parts.push(`${ten}`)
  }

  return `${eok}억 ${parts.join(' ')}만`
}
