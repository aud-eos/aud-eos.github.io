import { useEffect, useReducer } from "react";
import { STREAM_ORIGIN } from "@/constants";
import styles from "./NowPlayingCard.module.scss";

const MAIN_CHANNEL_SLUG = "main";
const POLL_INTERVAL_MS = 30_000;
const PROGRESS_TICK_MS = 1_000;

function formatMs( ms: number ): string {
  const totalSeconds = Math.floor( ms / 1000 );
  const hours = Math.floor( totalSeconds / 3600 );
  const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
  const seconds = totalSeconds % 60;
  if( hours > 0 ) {
    const minutesPadded = minutes.toString().padStart( 2, "0" );
    const secondsPadded = seconds.toString().padStart( 2, "0" );
    return `${hours}:${minutesPadded}:${secondsPadded}`;
  }
  const secondsPadded = seconds.toString().padStart( 2, "0" );
  return `${minutes}:${secondsPadded}`;
}

type Track = {
  title: string;
  artist: string | null;
  started_at: string | null;
  duration_ms: number | null;
  position_ms: number | null;
};

type NowPlaying = {
  channel: { slug: string; name: string; description: string | null };
  source: "live" | "scheduled" | "loop_fallback";
  track: Track | null;
  next_track: { title: string; artist: string | null } | null;
  listener_count: number;
};

type State = {
  data: NowPlaying | null;
  errored: boolean;
  displayPositionMs: number;
  epoch: number;
};

type Action =
  | { type: "data"; payload: NowPlaying }
  | { type: "error" }
  | { type: "tick"; epoch: number };

function reducer( state: State, action: Action ): State {
  switch ( action.type ) {
  case "data":
    return {
      data: action.payload,
      errored: false,
      displayPositionMs: action.payload.track?.position_ms ?? 0,
      epoch: state.epoch + 1,
    };
  case "error":
    return { ...state, errored: true };
  case "tick": {
    if( action.epoch !== state.epoch ) return state;
    const durationMs = state.data?.track?.duration_ms ?? 0;
    return {
      ...state,
      displayPositionMs: Math.min( state.displayPositionMs + PROGRESS_TICK_MS, durationMs ),
    };
  }
  }
}

const SOURCE_LABEL: Record<NowPlaying["source"], string> = {
  live: "● Live now",
  scheduled: "Scheduled show",
  loop_fallback: "On rotation",
};

const INITIAL_STATE: State = { data: null, errored: false, displayPositionMs: 0, epoch: 0 };

export default function NowPlayingCard() {
  const [ state, dispatch ] = useReducer( reducer, INITIAL_STATE );
  const { data, errored, displayPositionMs, epoch } = state;

  useEffect( () => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const fetchOnce = async () => {
      try {
        const response = await fetch(
          `${STREAM_ORIGIN}/api/now-playing/${MAIN_CHANNEL_SLUG}`,
        );
        if( !response.ok ) throw new Error( `HTTP ${response.status}` );
        const payload = await response.json() as NowPlaying;
        if( !cancelled ) dispatch({ type: "data", payload });
      } catch {
        if( !cancelled ) dispatch({ type: "error" });
      }
    };

    const schedule = () => {
      timer = setTimeout( () => {
        if( document.visibilityState === "visible" ) fetchOnce();
        schedule();
      }, POLL_INTERVAL_MS );
    };

    const onVisibility = () => {
      if( document.visibilityState === "visible" ) fetchOnce();
    };

    fetchOnce();
    schedule();
    document.addEventListener( "visibilitychange", onVisibility );

    return () => {
      cancelled = true;
      if( timer ) clearTimeout( timer );
      document.removeEventListener( "visibilitychange", onVisibility );
    };
  }, [] );

  useEffect( () => {
    if( !data?.track ) return;
    if( data.track.duration_ms === null ) return;
    const capturedEpoch = epoch;
    const interval = setInterval( () => {
      dispatch({ type: "tick", epoch: capturedEpoch });
    }, PROGRESS_TICK_MS );
    return () => clearInterval( interval );
  }, [ data, epoch ] );

  if( errored ) {
    return (
      <a
        href={ `${STREAM_ORIGIN}/channels/${MAIN_CHANNEL_SLUG}` }
        target="_blank"
        rel="noopener noreferrer"
        className={ styles.offline }
      >
        <p className={ styles.sourceLabel }>● Stream offline</p>
        <p className={ styles.offlineCta }>Visit player →</p>
      </a>
    );
  }

  if( !data ) {
    return <div data-testid="now-playing-skeleton" className={ styles.skeleton } />;
  }

  return (
    <a
      href={ `${STREAM_ORIGIN}/channels/${data.channel.slug}` }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.card }
    >
      <div className={ styles.content }>
        <p className={ styles.sourceLabel }>
          { SOURCE_LABEL[data.source] }
          <span className={ styles.eq } aria-hidden="true">
            <span /><span /><span /><span />
          </span>
        </p>
        { data.track && (
          <div className={ styles.trackInfo }>
            <h2 className={ styles.trackTitle }>{ data.track.title }</h2>
            { data.track.artist && (
              <p className={ styles.artist }>{ data.track.artist }</p>
            ) }
            { data.track.duration_ms !== null && data.track.duration_ms > 0 && (
              <div className={ styles.progress }>
                <div className={ styles.progressTrack }>
                  <div
                    data-testid="now-playing-progress-fill"
                    className={ styles.progressFill }
                    style={ {
                      width: `${Math.min( 100, ( displayPositionMs / data.track.duration_ms ) * 100 )}%`,
                    } }
                  />
                </div>
                <span className={ styles.progressTime }>
                  { formatMs( displayPositionMs ) } / { formatMs( data.track.duration_ms ) }
                </span>
              </div>
            ) }
          </div>
        ) }
        { data.next_track && (
          <p className={ styles.upNext }>
            Up next · { data.next_track.title }
            { data.next_track.artist && ` · ${data.next_track.artist}` }
          </p>
        ) }
        <div className={ styles.footer }>
          <p data-testid="now-playing-channel-info" className={ styles.channelInfo }>
            { data.channel.name }
            { data.channel.description && ` · ${data.channel.description}` }
          </p>
          <div className={ styles.footerRow }>
            <span className={ styles.listenerCount }>
              { data.listener_count } listening
            </span>
            <span className={ styles.cta }>Tune in →</span>
          </div>
        </div>
      </div>
    </a>
  );
}
