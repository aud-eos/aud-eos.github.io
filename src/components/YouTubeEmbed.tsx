import { FC } from "react";
import Link from "next/link";
import { YouTubeOembed } from "@/utils/youtube/getOembed";
import styles from "@/styles/YouTubeEmbed.module.scss";

export interface YouTubeEmbedProps {
  oembed: YouTubeOembed;
  url: string;
}

const ALLOWED_IFRAME_HOST = "www.youtube.com";

function extractIframeSrc( html: string ): string | null {
  const srcMatch = html.match( /src="([^"]+)"/ );
  if( !srcMatch?.[1] ) {
    return null;
  }

  try {
    const parsedUrl = new URL( srcMatch[1] );
    if( parsedUrl.host !== ALLOWED_IFRAME_HOST ) {
      return null;
    }
    return srcMatch[1];
  } catch {
    return null;
  }
}

export const YouTubeEmbed: FC<YouTubeEmbedProps> = ({ oembed, url }) => {
  const iframeSrc = extractIframeSrc( oembed.html );

  if( !iframeSrc ) {
    return null;
  }

  return (
    <section className={ styles.youtubeEmbed }>
      <header className={ styles.youtubeHeader }>
        <h2>
          Watch &quot;<Link
            href={ url }
            target="_blank"
            rel="noopener noreferrer"
          >{ oembed.title }</Link>&quot; on{ " " }
          <Link
            href={ oembed.author_url }
            target="_blank"
            rel="noopener noreferrer"
          >YouTube</Link>
        </h2>
      </header>
      <div className={ styles.iframeWrapper }>
        <iframe
          title={ oembed.title }
          src={ iframeSrc }
          width="100%"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
};
