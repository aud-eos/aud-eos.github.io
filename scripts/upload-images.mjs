#!/usr/bin/env node

/**
 * Upload images from a local directory (or single file) to Contentful
 * as published assets.
 *
 * Usage (via Makefile):
 *   make upload-images DIR="/path/to/images"
 *   make upload-images DIR="/path/to/single-image.jpg"
 *
 * Outputs a JSON array of { filename, assetId, url } to stdout.
 * Progress messages go to stderr so stdout can be piped/redirected cleanly.
 */

import { createReadStream, readdirSync, statSync } from "fs";
import { basename, extname, join } from "path";
import contentfulManagement from "contentful-management";

const LOCALE = "en-US";
const PROCESS_POLL_INTERVAL_MS = 2000;
const PROCESS_MAX_ATTEMPTS = 20;

function parseArgs() {
  const args = process.argv.slice( 2 );
  const parsed = {};
  for( let index = 0; index < args.length; index++ ) {
    if( args[index] === "--dir" ) parsed.dir = args[++index];
    else if( args[index] === "--space-id" ) parsed.spaceId = args[++index];
    else if( args[index] === "--environment-id" ) parsed.environmentId = args[++index];
    else if( args[index] === "--token" ) parsed.token = args[++index];
  }
  return parsed;
}

function getImageFiles( dirOrFile ) {
  const stat = statSync( dirOrFile );
  if( stat.isFile() ) return [ dirOrFile ];
  return readdirSync( dirOrFile )
    .filter( name => /\.(jpg|jpeg|png|gif|webp)$/i.test( name ) )
    .sort()
    .map( name => join( dirOrFile, name ) );
}

function mimeTypeForPath( filePath ) {
  const extension = extname( filePath ).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return mimeTypes[extension] ?? "image/jpeg";
}

async function waitForProcessing( environment, assetId ) {
  for( let attempt = 0; attempt < PROCESS_MAX_ATTEMPTS; attempt++ ) {
    await new Promise( resolve => setTimeout( resolve, PROCESS_POLL_INTERVAL_MS ) );
    const asset = await environment.getAsset( assetId );
    if( asset.fields.file?.[LOCALE]?.url ) return asset;
  }
  throw new Error(
    `Asset ${assetId} did not finish processing within ${( PROCESS_MAX_ATTEMPTS * PROCESS_POLL_INTERVAL_MS ) / 1000}s`,
  );
}

async function uploadAndPublishImage( environment, filePath ) {
  const filename = basename( filePath );
  const title = basename( filePath, extname( filePath ) );

  const upload = await environment.createUpload({ file: createReadStream( filePath ) });

  const asset = await environment.createAsset({
    fields: {
      title: { [LOCALE]: title },
      file: {
        [LOCALE]: {
          contentType: mimeTypeForPath( filePath ),
          fileName: filename,
          uploadFrom: { sys: { type: "Link", linkType: "Upload", id: upload.sys.id } },
        },
      },
    },
  });

  await asset.processForLocale( LOCALE );
  const processed = await waitForProcessing( environment, asset.sys.id );
  const published = await processed.publish();

  return {
    filename,
    assetId: published.sys.id,
    url: `https:${published.fields.file[LOCALE].url}`,
  };
}

async function main() {
  const { dir, spaceId, environmentId, token } = parseArgs();

  if( !dir || !spaceId || !environmentId || !token ) {
    process.stderr.write(
      "Usage: node scripts/upload-images.mjs --dir <path> --space-id <id> --environment-id <env> --token <token>\n",
    );
    process.exit( 1 );
  }

  const client = contentfulManagement.createClient({ accessToken: token });
  const space = await client.getSpace( spaceId );
  const environment = await space.getEnvironment( environmentId );

  const filePaths = getImageFiles( dir );
  process.stderr.write( `Uploading ${filePaths.length} image(s) from ${dir}...\n` );

  const results = [];
  for( const filePath of filePaths ) {
    const filename = basename( filePath );
    process.stderr.write( `  [${results.length + 1}/${filePaths.length}] ${filename}...\n` );
    const result = await uploadAndPublishImage( environment, filePath );
    process.stderr.write( `  ✓ ${result.assetId}\n` );
    results.push( result );
  }

  process.stdout.write( JSON.stringify( results, null, 2 ) + "\n" );
  process.stderr.write( `\nDone! ${results.length} asset(s) uploaded.\n` );
}

main().catch( error => {
  process.stderr.write( `Error: ${error.message}\n` );
  process.exit( 1 );
});
