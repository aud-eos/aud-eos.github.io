export const MAX_PREVIEW_RESULTS = 5;

export interface SearchPost {
  title: string;
  slug: string;
  description: string;
  body: string;
  author: string;
  spotifyText: string;
  tags: string[];
  date: string;
  imageUrl: string;
}
