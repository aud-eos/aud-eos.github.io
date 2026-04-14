#!/usr/bin/env node

import { readdirSync, statSync } from "fs";
import { extname, join } from "path";

const SUPPORTED_EXTENSIONS = new Set( [ ".jpg", ".jpeg", ".png", ".gif", ".webp" ] );

export function getImageFiles( dirOrFile ) {
  const stat = statSync( dirOrFile );
  if( stat.isFile() ) return [ dirOrFile ];

  return readdirSync( dirOrFile )
    .filter( ( name ) => SUPPORTED_EXTENSIONS.has( extname( name ).toLowerCase() ) )
    .sort()
    .map( ( name ) => join( dirOrFile, name ) );
}
