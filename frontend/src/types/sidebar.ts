export type ApartmentSummary = {
  aptId: string
  aptName: string
  location: string
  households: number
  builtYear: number
  recentPrice: number
}

export type PopularPost = {
  postId: number
  title: string
  likeCount: number
  commentCount: number
}

export type MostCommentedPost = {
  postId: number
  title: string
  commentCount: number
}

export type PriceTrendData = {
  period: '1w' | '1m'
  avgPrice: number
  changeRate: number
  transactionCount: number
}

export type HighestPriceDeal = {
  aptId: string
  aptName: string
  price: number
  dealDate: string
  area: number
  isNewHigh: boolean
}

export type TopTransactionApartment = {
  rank: number
  aptId: string
  aptName: string
  transactionCount: number
}
