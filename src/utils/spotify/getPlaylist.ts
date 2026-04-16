import axios from "axios";
import fs from "fs";
import path from "path";
import { strict as assert } from "assert";
import { getClientCredentials } from "./getClientCredentials";
import { retryRequest } from "./retryRequest";


const CACHE_DIR = path.join( process.cwd(), "data", "spotify" );


const SPOTIFY_CLIENT_ID: string = process.env[
  "SPOTIFY_CLIENT_ID"
] as string;
const SPOTIFY_CLIENT_SECRET: string = process.env[
  "SPOTIFY_CLIENT_SECRET"
] as string;

assert( !!SPOTIFY_CLIENT_ID );
assert( !!SPOTIFY_CLIENT_SECRET );

/**
 * Get Playlist
 * Get a playlist owned by a Spotify user.
 * https://developer.spotify.com/documentation/web-api/reference/get-playlist
 */
export interface SpotifyPlaylist {
  collaborative: boolean
  description: string|null
  external_urls: { spotify: string }
  followers: { href: string|null; total: number }
  href: string
  id: string
  images: SpotifyImageObject[]
  name: string
  owner: SpotifyUser
  public: boolean
  snapshot_id: string
  tracks: SpotifyPlaylistTracks
}

interface SpotifyPlaylistTracks {
  href: string
  limit: number
  next: string|null
  offset: number
  previous: string|null
  total: number
  items: SpotifyPlaylistTrackObject[]
}

interface SpotifyPlaylistTrackObject {
  added_at: string
  added_by: SpotifyUser
  is_local: boolean
  track: SpotifyTrackObject
}

interface SpotifyTrackObject {
  album: SpotifyAlbum
  artists: SpotifyArtistObject[]
  duration_ms: number
  explicit: boolean
  external_ids: { isrc: string, ean: string, upc: string }
  external_urls: { spotify: string }
  href: string
  id: string
  is_playable: boolean
  name: string
  popularity: number
  preview_url: string
  track_number: number
  type: string
  uri: string
  is_local: boolean
}

interface SpotifyAlbum {
  album_type: string
  total_tracks: number
  external_urls: { spotify: string }
  href: string
  id: string
  images: SpotifyImageObject[]
  name: string
  release_date: string
  release_date_precision: string
  type: string
  uri: string
  copyrights: { text: string, type: string }
  external_ids: { isrc: string, ean: string, upc: string }
  genres: string[]
  label: string
  popularity: number
  album_group: string
  artists: SpotifySimplifiedArtistObject[]
}

interface SpotifyArtistObject {
  external_urls: { spotify: string }
  followers: { total: number }
  genres: string[]
  href: string
  id: string
  images: SpotifyImageObject[]
  name: string
  popularity: number
  type: string
  uri: string
}

interface SpotifySimplifiedArtistObject {
  external_urls: { spotify: string }
  href: string
  id: string
  name: string
  type: string
  uri: string
}

interface SpotifyImageObject {
  url: string
  height: number|null
  width: number|null
}

interface SpotifyUser {
  external_urls: { spotify: string }
  id: string
  display_name: string|null
  href: string
  uri: string
  type: string
  followers: { href: string|null; total: number }
}


function getCachePath( playlistId: string ): string {
  return path.join( CACHE_DIR, `${playlistId}.json` );
}


function readCachedPlaylist( playlistId: string ): SpotifyPlaylist | null {
  const cachePath = getCachePath( playlistId );
  if( !fs.existsSync( cachePath ) ) return null;
  const raw = fs.readFileSync( cachePath, "utf-8" );
  return JSON.parse( raw ) as SpotifyPlaylist;
}


function writeCachedPlaylist( playlistId: string, playlist: SpotifyPlaylist ): void {
  fs.mkdirSync( CACHE_DIR, { recursive: true });
  const cachePath = getCachePath( playlistId );
  fs.writeFileSync( cachePath, JSON.stringify( playlist, null, 2 ) );
}


async function fetchSnapshotId( playlistId: string, accessToken: string ): Promise<string> {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}?fields=snapshot_id`;
  const headers = {
    "Accept": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  };
  const { data } = await retryRequest( () => axios.get<{ snapshot_id: string }>( url, { headers }) );
  return data.snapshot_id;
}


async function fetchFullPlaylist( playlistId: string, accessToken: string ): Promise<SpotifyPlaylist> {
  const url = `https://api.spotify.com/v1/playlists/${playlistId}`;
  const headers = {
    "Accept": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  };
  const { data } = await retryRequest( () => axios.get<SpotifyPlaylist>( url, { headers }) );
  return data;
}


export async function getPlaylist( playlistId: string ): Promise<SpotifyPlaylist> {
  const credentials = await getClientCredentials();
  const cached = readCachedPlaylist( playlistId );

  const remoteSnapshotId = await fetchSnapshotId( playlistId, credentials.access_token );

  if( cached && cached.snapshot_id === remoteSnapshotId ) {
    console.log( `Spotify cache hit for playlist ${playlistId} (snapshot ${remoteSnapshotId})` );
    return cached;
  }

  console.log( `Spotify cache miss for playlist ${playlistId} — fetching full playlist` );
  const playlist = await fetchFullPlaylist( playlistId, credentials.access_token );
  writeCachedPlaylist( playlistId, playlist );
  return playlist;
}
