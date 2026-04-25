export interface TikTokOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}

const OEMBED_ENDPOINT = "https://www.tiktok.com/oembed";

export async function getOembed( tiktokUrl: string ): Promise<TikTokOembed | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&dark_mode=1&url=${encodeURIComponent( tiktokUrl )}`;

  try {
    const response = await fetch( url );

    if( !response.ok ) {
      return null;
    }

    const data: TikTokOembed = await response.json();
    return data;
  } catch {
    return null;
  }
}
