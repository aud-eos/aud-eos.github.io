import { useEffect, useState } from "react";
import { AUDEOS_PLAY_ORIGIN } from "@/constants";
import styles from "./NowPlayingCard.module.scss";

const MAIN_CHANNEL_SLUG = "main";

type Track = {
  title: string;
  artist: string | null;
  started_at: string;
  duration_ms: number;
  position_ms: number;
};

type NowPlaying = {
  channel: { slug: string; name: string; description: string | null };
  source: "live" | "scheduled" | "loop_fallback";
  track: Track | null;
  next_track: { title: string; artist: string | null } | null;
  listener_count: number;
};

const SOURCE_LABEL: Record<NowPlaying["source"], string> = {
  live: "● Live now",
  scheduled: "Scheduled show",
  loop_fallback: "On rotation",
};

export default function NowPlayingCard() {
  const [ data, setData ] = useState<NowPlaying | null>( null );

  useEffect( () => {
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const response = await fetch(
          `${AUDEOS_PLAY_ORIGIN}/api/now-playing/${MAIN_CHANNEL_SLUG}`,
        );
        if( !response.ok ) throw new Error( `HTTP ${response.status}` );
        const payload = await response.json() as NowPlaying;
        if( !cancelled ) setData( payload );
      } catch {
        // error handling lands in Task 4
      }
    };
    fetchOnce();
    return () => { cancelled = true; };
  }, [] );

  if( !data ) {
    return <div data-testid="now-playing-skeleton" className={ styles.skeleton } />;
  }

  return (
    <a
      href={ `${AUDEOS_PLAY_ORIGIN}/channels/${data.channel.slug}` }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.card }
    >
      <p className={ styles.sourceLabel }>{ SOURCE_LABEL[data.source] }</p>
      { data.track && (
        <div>
          <h2 className={ styles.trackTitle }>{ data.track.title }</h2>
          { data.track.artist && (
            <p className={ styles.artist }>{ data.track.artist }</p>
          ) }
        </div>
      ) }
    </a>
  );
}
