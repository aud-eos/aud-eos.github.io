import { FC } from "react";
import Link from "next/link";
import { SoundCloudOembed } from "@/utils/soundcloud/getOembed";
import styles from "@/styles/SoundCloudEmbed.module.scss";

export interface SoundCloudEmbedProps {
  oembed: SoundCloudOembed;
  url: string;
}

const ALLOWED_IFRAME_HOST = "w.soundcloud.com";

function extractIframeSrc( html: string ): string | null {
  const srcMatch = html.match( /src="([^"]+)"/ );
  if( !srcMatch?.[1] ) {
    return null;
  }

  try {
    const url = new URL( srcMatch[1] );
    if( url.host !== ALLOWED_IFRAME_HOST ) {
      return null;
    }
    return srcMatch[1];
  } catch {
    return null;
  }
}

export const SoundCloudEmbed: FC<SoundCloudEmbedProps> = ({ oembed, url }) => {
  const iframeSrc = extractIframeSrc( oembed.html );

  if( !iframeSrc ) {
    return null;
  }

  return (
    <section className={ styles.soundcloudEmbed }>
      <header className={ styles.soundcloudHeader }>
        <h2>
          Listen to &quot;<Link href={ url } target="_blank" rel="noopener noreferrer">{ oembed.title }</Link>&quot; by{ " " }
          <Link href={ oembed.author_url } target="_blank" rel="noopener noreferrer">{ oembed.author_name }</Link>
        </h2>
      </header>
      <iframe
        title={ `${oembed.title} by ${oembed.author_name}` }
        src={ iframeSrc }
        width="100%"
        height="166"
        allow="autoplay"
      />
    </section>
  );
};
