export type AdSlotType = 'RIGHT_SIDEBAR_MIDDLE' | 'RIGHT_SIDEBAR_BOTTOM'

export type Ad = {
  adId:        string
  slot:        AdSlotType
  title:       string
  description: string
  imageUrl:    string
  linkUrl:     string
  priority:    number
  weight:      number
}

export type AdFallbackContent = {
  label:    string
  linkPath: string
}
