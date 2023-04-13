/**
 * Spotify Client Credentials flow
 * https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow
 *
 * The Client Credentials flow is used in server-to-server authentication.
 * Since this flow does not include authorization, only endpoints that do not
 * access user information can be accessed.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#client_credentials_flow
 */
import axios from "axios";
import { strict as assert } from "assert";


const SPOTIFY_CLIENT_ID: string = process.env[
  "SPOTIFY_CLIENT_ID"
] as string;
const SPOTIFY_CLIENT_SECRET: string = process.env[
  "SPOTIFY_CLIENT_SECRET"
] as string;


assert( !!SPOTIFY_CLIENT_ID );
assert( !!SPOTIFY_CLIENT_SECRET );


export const getClientCredentials = async () => {
  const credentials = Buffer
    .from( `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`, "utf8" )
    .toString( "base64" );
  const headers = {
    "Authorization": `Basic ${credentials}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  const body = { grant_type: "client_credentials" };
  const cfg = { headers };
  const url = "https://accounts.spotify.com/api/token";
  return axios.post<{
    access_token: string
    token_type: string
    expires_in: number
  }>( url, body, cfg )
    .then( response => {
      return response.data;
    });
};
