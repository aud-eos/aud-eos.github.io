import { FC, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { TikTokOembed } from "@/utils/tiktok/getOembed";
import styles from "@/styles/TikTokEmbed.module.scss";

export interface TikTokEmbedProps {
  oembed: TikTokOembed;
  oembedDark?: TikTokOembed | null;
  url: string;
}

const TIKTOK_EMBED_SCRIPT_SRC = "https://www.tiktok.com/embed.js";
const LIGHT_MODE_QUERY = "(prefers-color-scheme: light)";

function stripScriptTags( html: string ): string {
  return html.replace( /<script[^>]*>[\s\S]*?<\/script>/gi, "" );
}

function useIsLightMode(): boolean {
  const subscribe = useCallback( ( callback: () => void ) => {
    const mediaQuery = window.matchMedia( LIGHT_MODE_QUERY );
    mediaQuery.addEventListener( "change", callback );
    return () => mediaQuery.removeEventListener( "change", callback );
  }, [] );

  const getSnapshot = useCallback(
    () => window.matchMedia( LIGHT_MODE_QUERY ).matches,
    [],
  );

  return useSyncExternalStore( subscribe, getSnapshot, () => false );
}

export const TikTokEmbed: FC<TikTokEmbedProps> = ({ oembed, oembedDark, url }) => {
  const scriptRef = useRef<HTMLDivElement>( null );
  const isLight = useIsLightMode();
  const activeOembed = isLight || !oembedDark ? oembed : oembedDark;

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
  }, [ activeOembed ] );

  // Safe: oEmbed HTML is fetched at build time from TikTok's official API —
  // a trusted first-party source, not user-supplied input. Script tags are
  // stripped since we load embed.js separately via useEffect.
  const sanitizedHtml = { __html: stripScriptTags( activeOembed.html ) };

  return (
    <section className={ styles.tiktokEmbed }>
      <header className={ styles.tiktokHeader }>
        <h2>
          Watch &quot;<Link
            href={ url }
            target="_blank"
            rel="noopener noreferrer"
          >{ activeOembed.title }</Link>&quot; on{ " " }
          <Link
            href={ activeOembed.author_url }
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
