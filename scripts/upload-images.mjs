#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "fs";
import { basename, extname, join } from "path";
import contentfulManagement from "contentful-management";

const SUPPORTED_EXTENSIONS = new Set( [ ".jpg", ".jpeg", ".png", ".gif", ".webp" ] );

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export function getImageFiles( dirOrFile ) {
  const stat = statSync( dirOrFile );
  if( stat.isFile() ) return [ dirOrFile ];

  return readdirSync( dirOrFile )
    .filter( ( name ) => SUPPORTED_EXTENSIONS.has( extname( name ).toLowerCase() ) )
    .sort()
    .map( ( name ) => join( dirOrFile, name ) );
}

export function mimeTypeForPath( filePath ) {
  const extension = extname( filePath ).toLowerCase();
  return MIME_TYPES[extension];
}

const LOCALE = "en-US";
const POLL_MAX_WAIT_MS = 30_000;
const POLL_INITIAL_INTERVAL_MS = 1_000;
const POLL_MAX_INTERVAL_MS = 10_000;

async function waitForProcessing( environment, assetId ) {
  let elapsed = 0;
  let interval = POLL_INITIAL_INTERVAL_MS;

  while( elapsed < POLL_MAX_WAIT_MS ) {
    await new Promise( ( resolve ) => setTimeout( resolve, interval ) );
    elapsed += interval;

    const asset = await environment.getAsset( assetId );
    if( asset.fields.file?.[LOCALE]?.url ) return asset;

    interval = Math.min( interval * 2, POLL_MAX_INTERVAL_MS );
  }

  throw new Error( `Asset ${assetId} did not finish processing within ${POLL_MAX_WAIT_MS / 1000}s` );
}

export async function uploadAndPublishImage( environment, filePath ) {
  const filename = basename( filePath );
  const title = basename( filePath, extname( filePath ) );
  const buffer = readFileSync( filePath );

  const upload = await environment.createUpload( { file: buffer } );

  const asset = await environment.createAsset( {
    fields: {
      title: { [LOCALE]: title },
      file: {
        [LOCALE]: {
          contentType: mimeTypeForPath( filePath ),
          fileName: filename,
          uploadFrom: {
            sys: { type: "Link", linkType: "Upload", id: upload.sys.id },
          },
        },
      },
    },
  } );

  await asset.processForAllLocales();
  const processed = await waitForProcessing( environment, asset.sys.id );
  const published = await processed.publish();

  return {
    filename,
    assetId: published.sys.id,
    url: `https:${published.fields.file[LOCALE].url}`,
  };
}

export async function main( args ) {
  const dirOrFile = args[0];

  if( !dirOrFile ) {
    process.stderr.write( "Usage: node scripts/upload-images.mjs <path-to-images>\n" );
    process.exit( 1 );
    return;
  }

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT || "master";

  if( !spaceId || !accessToken ) {
    process.stderr.write(
      "Missing required env vars: CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN\n",
    );
    process.exit( 1 );
    return;
  }

  const client = contentfulManagement.createClient( { accessToken } );
  const space = await client.getSpace( spaceId );
  const environment = await space.getEnvironment( environmentId );

  const filePaths = getImageFiles( dirOrFile );
  process.stderr.write( `Uploading ${filePaths.length} image(s) from ${dirOrFile}...\n` );

  const results = [];
  const failures = [];

  for( const filePath of filePaths ) {
    const filename = basename( filePath );
    process.stderr.write( `  [${results.length + failures.length + 1}/${filePaths.length}] ${filename}...` );

    try {
      const result = await uploadAndPublishImage( environment, filePath );
      process.stderr.write( ` done (${result.assetId})\n` );
      results.push( result );
    } catch( error ) {
      process.stderr.write( ` FAILED: ${error.message}\n` );
      failures.push( { filename, error: error.message } );
    }
  }

  process.stdout.write( JSON.stringify( results, null, 2 ) + "\n" );

  if( failures.length > 0 ) {
    process.stderr.write( `\n${failures.length} upload(s) failed:\n` );
    for( const failure of failures ) {
      process.stderr.write( `  - ${failure.filename}: ${failure.error}\n` );
    }
  }

  process.stderr.write( `\nDone: ${results.length} succeeded, ${failures.length} failed.\n` );
  process.exit( failures.length > 0 ? 1 : 0 );
}

// Run when executed directly (not imported by tests)
const isDirectRun = process.argv[1]?.endsWith( "upload-images.mjs" );
if( isDirectRun ) {
  main( process.argv.slice( 2 ) );
}
