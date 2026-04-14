export interface YouTubeOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}

const OEMBED_ENDPOINT = "https://www.youtube.com/oembed";

export async function getOembed( youtubeUrl: string ): Promise<YouTubeOembed | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent( youtubeUrl )}`;

  try {
    const response = await fetch( url );

    if( !response.ok ) {
      return null;
    }

    const data: YouTubeOembed = await response.json();
    return data;
  } catch {
    return null;
  }
}
