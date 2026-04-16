import { AxiosError, AxiosResponse } from "axios";


const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;
const MAX_JITTER_MS = 500;


/**
 * Retry an async request with exponential backoff.
 * Respects the Retry-After header from 429 responses,
 * with a minimum 1s floor even when Retry-After is 0.
 */
export async function retryRequest<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
): Promise<AxiosResponse<T>> {
  let lastError: AxiosError | undefined;

  for( let attempt = 0; attempt <= MAX_RETRIES; attempt++ ) {
    try {
      return await requestFn();
    } catch ( error: unknown ) {
      if( !isAxiosError( error ) || error.response?.status !== 429 ) {
        throw error;
      }

      lastError = error;

      if( attempt === MAX_RETRIES ) break;

      const retryAfterHeader = error.response.headers["retry-after"];
      const retryAfterSeconds = retryAfterHeader ? Number( retryAfterHeader ) : 0;
      const retryAfterMs = Math.max( retryAfterSeconds * 1000, INITIAL_DELAY_MS );
      const backoff = retryAfterMs * Math.pow( 2, attempt );
      const jitter = Math.random() * MAX_JITTER_MS;
      const delayMs = backoff + jitter;

      console.warn(
        `Spotify 429 — retrying in ${Math.round( delayMs )}ms (attempt ${attempt + 1}/${MAX_RETRIES})`,
      );

      await sleep( delayMs );
    }
  }

  throw lastError;
}


function isAxiosError( error: unknown ): error is AxiosError {
  return error instanceof Error && "isAxiosError" in error;
}


function sleep( ms: number ): Promise<void> {
  return new Promise( resolve => setTimeout( resolve, ms ) );
}
