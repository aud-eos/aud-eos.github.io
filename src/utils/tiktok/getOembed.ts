import { JSDOM } from "jsdom";

export interface TikTokOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}

const OEMBED_ENDPOINT = "https://www.tiktok.com/oembed";

function stripScriptTags( html: string ): string {
  const dom = new JSDOM( html );
  const scripts = dom.window.document.querySelectorAll( "script" );
  scripts.forEach( ( element: Element ) => element.remove() );
  return dom.window.document.body.innerHTML;
}

export async function getOembed( tiktokUrl: string ): Promise<TikTokOembed | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&dark_mode=1&url=${encodeURIComponent( tiktokUrl )}`;

  try {
    const response = await fetch( url );

    if( !response.ok ) {
      return null;
    }

    const data: TikTokOembed = await response.json();
    data.html = stripScriptTags( data.html );
    return data;
  } catch {
    return null;
  }
}
