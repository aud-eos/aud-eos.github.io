export interface CategoryConfig {
  title: string
  description: string
  ogImage: string | null
}

export type CategoryConfigMap = Record<string, CategoryConfig>
