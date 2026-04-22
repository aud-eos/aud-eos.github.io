export interface TagSeoConfig {
  title: string
  description: string
  ogImage: string | null
}

export type TagSeoConfigMap = Record<string, TagSeoConfig>
