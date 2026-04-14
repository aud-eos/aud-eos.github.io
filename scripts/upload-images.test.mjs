// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { getImageFiles } from "./upload-images.mjs";

describe( "getImageFiles", () => {
  let tempDir;

  beforeEach( () => {
    tempDir = mkdtempSync( join( tmpdir(), "upload-test-" ) );
  });

  afterEach( () => {
    rmSync( tempDir, { recursive: true, force: true } );
  });

  it( "returns a single file when given a file path", () => {
    const filePath = join( tempDir, "photo.jpg" );
    writeFileSync( filePath, "fake image data" );

    const result = getImageFiles( filePath );
    expect( result ).toEqual( [ filePath ] );
  });

  it( "returns all supported image files from a directory, sorted alphabetically", () => {
    const fileNames = [ "charlie.png", "alpha.jpg", "bravo.webp" ];
    for( const name of fileNames ) {
      writeFileSync( join( tempDir, name ), "fake" );
    }

    const result = getImageFiles( tempDir );
    expect( result ).toEqual( [
      join( tempDir, "alpha.jpg" ),
      join( tempDir, "bravo.webp" ),
      join( tempDir, "charlie.png" ),
    ] );
  });

  it( "excludes non-image files from a directory", () => {
    writeFileSync( join( tempDir, "readme.txt" ), "text" );
    writeFileSync( join( tempDir, "photo.jpg" ), "image" );
    writeFileSync( join( tempDir, "data.json" ), "{}" );

    const result = getImageFiles( tempDir );
    expect( result ).toEqual( [ join( tempDir, "photo.jpg" ) ] );
  });

  it( "supports all five image extensions", () => {
    const extensions = [ ".jpg", ".jpeg", ".png", ".gif", ".webp" ];
    for( const ext of extensions ) {
      writeFileSync( join( tempDir, `image${ext}` ), "fake" );
    }

    const result = getImageFiles( tempDir );
    expect( result ).toHaveLength( 5 );
  });
});
