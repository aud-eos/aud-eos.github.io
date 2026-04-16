import { useState, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { SpotifyPlaylist } from "@/utils/spotify/getPlaylist";
import styles from "@/styles/Playlist.module.scss";


const INITIAL_VISIBLE_TRACKS = 20;


function formatDuration( durationMs: number ): string {
  const totalSeconds = Math.floor( durationMs / 1000 );
  const minutes = Math.floor( totalSeconds / 60 );
  const seconds = totalSeconds % 60;
  return `${minutes}:${String( seconds ).padStart( 2, "0" )}`;
}


function findSmallAlbumImage( images: { url: string; width: number | null; height: number | null }[] ): string | null {
  const small = images.find( image => image.width === 64 );
  if( small ) return small.url;
  if( images.length > 0 ) return images[images.length - 1].url;
  return null;
}


export interface SpotifyPlaylistProps {
  playlist: SpotifyPlaylist;
}


export default function Playlist({ playlist }: SpotifyPlaylistProps ) {
  const [ isExpanded, setIsExpanded ] = useState( false );
  const tracks = playlist.tracks.items;
  const hasHiddenTracks = tracks.length > INITIAL_VISIBLE_TRACKS;
  const coverImage = playlist.images[0];

  return (
    <section>
      <header className={ styles.header }>
        { coverImage && (
          <Image
            className={ styles.cover }
            src={ coverImage.url }
            alt={ `${playlist.name} playlist cover` }
            width={ 100 }
            height={ 100 }
          />
        ) }
        <div className={ styles.details }>
          <h2>
            <Link href={ playlist.external_urls.spotify }>
              { playlist.name }
            </Link>
          </h2>
          <div className={ styles.meta }>
            <Image
              className={ styles.spotifyLogo }
              src="/images/spotify.png"
              alt="Spotify"
              width={ 18 }
              height={ 18 }
            />
            <Link className={ styles.ownerLink } href={ playlist.owner.external_urls.spotify }>
              { playlist.owner.display_name }
            </Link>
            <span>·</span>
            <span>{ playlist.tracks.total } songs</span>
            <span>·</span>
            <span>{ playlist.followers.total } followers</span>
          </div>
        </div>
      </header>

      <ul className={ styles.trackList }>
        { tracks.map( ( track, index ) => {
          const albumArtUrl = findSmallAlbumImage( track.track.album.images );
          const isHidden = !isExpanded && index >= INITIAL_VISIBLE_TRACKS;

          return (
            <li
              key={ track.track.id }
              className={ `${styles.track}${isHidden ? ` ${styles.hidden}` : ""}` }
            >
              <span className={ styles.trackNumber }>{ index + 1 }</span>
              { albumArtUrl && (
                <Link href={ track.track.external_urls.spotify }>
                  <Image
                    className={ styles.albumArt }
                    src={ albumArtUrl }
                    alt={ `${track.track.album.name} cover` }
                    width={ 44 }
                    height={ 44 }
                  />
                </Link>
              ) }
              <div className={ styles.trackInfo }>
                <div className={ styles.trackTitle }>
                  <Link href={ track.track.external_urls.spotify }>
                    { track.track.name }
                  </Link>
                </div>
                <div className={ styles.trackArtists }>
                  { track.track.artists.map( ( artist, artistIndex ) => (
                    <Fragment key={ artist.id }>
                      <Link href={ artist.external_urls.spotify }>
                        { artist.name }
                      </Link>
                      { artistIndex < track.track.artists.length - 1 && ", " }
                    </Fragment>
                  ) ) }
                </div>
              </div>
              <div className={ styles.trackAlbum }>
                <Link href={ track.track.album.external_urls.spotify }>
                  { track.track.album.name }
                </Link>
              </div>
              <span className={ styles.trackDuration }>
                { formatDuration( track.track.duration_ms ) }
              </span>
            </li>
          );
        }) }
      </ul>

      { hasHiddenTracks && (
        <button
          className={ styles.expandToggle }
          onClick={ () => setIsExpanded( !isExpanded ) }
        >
          { isExpanded ? "Show less" : `Show all ${tracks.length} tracks` }
        </button>
      ) }

      <div className={ styles.footerCta }>
        <Image
          className={ styles.spotifyLogo }
          src="/images/spotify.png"
          alt="Spotify"
          width={ 18 }
          height={ 18 }
        />
        <Link href={ playlist.external_urls.spotify }>
          Listen on Spotify
        </Link>
      </div>
    </section>
  );
}
