export interface SoundCloudOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}

const OEMBED_ENDPOINT = "https://soundcloud.com/oembed";

export async function getOembed( soundcloudUrl: string ): Promise<SoundCloudOembed | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent( soundcloudUrl )}`;

  try {
    const response = await fetch( url );

    if( !response.ok ) {
      return null;
    }

    const data: SoundCloudOembed = await response.json();
    return data;
  } catch {
    return null;
  }
}
