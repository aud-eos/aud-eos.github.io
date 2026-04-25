export interface TikTokOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}

const OEMBED_ENDPOINT = "https://www.tiktok.com/oembed";

export interface TikTokOembedOptions {
  darkMode?: boolean;
}

export async function getOembed( tiktokUrl: string, options?: TikTokOembedOptions ): Promise<TikTokOembed | null> {
  const darkParam = options?.darkMode ? "&dark_mode=1" : "";
  const url = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent( tiktokUrl )}${darkParam}`;

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
