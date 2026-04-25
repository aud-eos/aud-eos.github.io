import { FC, useEffect, useRef } from "react";
import Link from "next/link";
import { TikTokOembed } from "@/utils/tiktok/getOembed";
import styles from "@/styles/TikTokEmbed.module.scss";

export interface TikTokEmbedProps {
  oembed: TikTokOembed;
  url: string;
}

const TIKTOK_EMBED_SCRIPT_SRC = "https://www.tiktok.com/embed.js";

function stripScriptTags( html: string ): string {
  const doc = new DOMParser().parseFromString( html, "text/html" );
  for( const script of Array.from( doc.querySelectorAll( "script" ) ) ) {
    script.remove();
  }
  return doc.body.innerHTML;
}

export const TikTokEmbed: FC<TikTokEmbedProps> = ({ oembed, url }) => {
  const scriptRef = useRef<HTMLDivElement>( null );

  useEffect( () => {
    const container = scriptRef.current;
    if( !container ) {
      return;
    }

    const script = document.createElement( "script" );
    script.src = TIKTOK_EMBED_SCRIPT_SRC;
    script.async = true;
    container.appendChild( script );

    return () => {
      script.remove();
    };
  }, [] );

  // Safe: oEmbed HTML is fetched at build time from TikTok's official API —
  // a trusted first-party source, not user-supplied input. Script tags are
  // stripped since we load embed.js separately via useEffect.
  const sanitizedHtml = { __html: stripScriptTags( oembed.html ) };

  return (
    <section className={ styles.tiktokEmbed }>
      <header className={ styles.tiktokHeader }>
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
          >TikTok</Link>
        </h2>
      </header>
      <div
        className={ styles.embedContainer }
        dangerouslySetInnerHTML={ sanitizedHtml }
      />
      <div ref={ scriptRef } />
    </section>
  );
};
