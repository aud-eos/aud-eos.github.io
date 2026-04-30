export type ArchiveFilter =
  | { kind: "all" }
  | { kind: "tag"; id: string }
  | { kind: "category"; id: string };

export interface ArchiveSeo {
  title: string
  description: string
  ogImage: string
  canonical: string
}
