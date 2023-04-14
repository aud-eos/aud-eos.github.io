import { SpotifyPlaylist } from "@/utils/spotify/getPlaylist";
import Image from "next/image";
import Link from "next/link";
import styles from "@/styles/Playlist.module.scss";
import DateTimeFormat from "./DateTimeFormat";
import { Fragment } from "react";

export interface SpotifyPlaylistProps {
  playlist: SpotifyPlaylist;
}

export function PlaylistHeader({ playlist }: SpotifyPlaylistProps ){
  return (
    <section className={ styles.playlistHeader }>
      <Link href={ playlist.external_urls.spotify }>
        <Image src={ "/images/spotify.png" } alt="Spotify logo" width={ 50 } height={ 50 } />
      </Link>
      <section>
        <h2>
          Listen to the
          &quot;
          <Link href={ playlist.external_urls.spotify }>
            { playlist.name }
          </Link>
          &quot;
          playlist from <Link href={ playlist.owner.external_urls.spotify }>
            { playlist.owner.display_name }
          </Link>
        </h2>
      </section>
    </section>
  );
}

export default function Playlist({ playlist }: SpotifyPlaylistProps ){
  return (
    <>
    <PlaylistHeader playlist={ playlist } />
    <ul className={ styles.playlist }>
      {
        playlist.tracks.items
          .map( track => {

            const albumCover = track.track.album.images
              .find( image => image.width == 300 );

            const artists = track.track.artists
              .map( artist => artist.name )
              .join( ", " );

            return (
              <li key={ track.track.id }>
                {
                  !!albumCover &&
                  <>
                    <Link href={ track.track.external_urls.spotify }>
                      <Image
                        src={ albumCover.url }
                        width={ 150 }
                        height={ 150 }
                        alt={ `${artists} - ${track.track.album.name} album cover` }
                      />
                    </Link>
                    <ul>
                      <li>
                        Song Title: <Link href={ track.track.external_urls.spotify }>
                          { track.track.name }
                        </Link>
                      </li>
                      <li>
                        Artist: {
                          track.track.artists
                            .map( ( artist, idx ) =>
                              <Fragment key={ artist.id }>
                                <Link
                                  href={ artist.external_urls.spotify }>
                                  { artist.name }
                                </Link>
                                { /* Conditionally add comma delimiter to artist list */ }
                                { ( track.track.artists?.[idx + 1] ) && `, ` }
                              </Fragment>
                              )
                        }
                      </li>
                      <li>
                        Album: <Link href={ track.track.album.external_urls.spotify }>
                          { track.track.album.name }
                        </Link>
                      </li>
                      <li>
                        Release Date: <DateTimeFormat
                          timestamp={ track.track.album.release_date }
                          withTime={ false }
                          withDayName={ false }
                        />
                      </li>
                    </ul>
                    </>
                }
              </li>
              );
            })
      }
    </ul>
    <PlaylistHeader playlist={ playlist } />
    <h3 className={ styles.totalTracks }>
      [ { playlist.tracks.total } songs ... { playlist.followers.total } followers ]
    </h3>
    </>
  );
}
