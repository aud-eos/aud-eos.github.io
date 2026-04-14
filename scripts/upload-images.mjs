#!/usr/bin/env node

import { readdirSync, statSync } from "fs";
import { extname, join } from "path";

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
