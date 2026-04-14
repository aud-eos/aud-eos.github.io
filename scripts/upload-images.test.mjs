// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { getImageFiles, mimeTypeForPath, uploadAndPublishImage } from "./upload-images.mjs";

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

describe( "mimeTypeForPath", () => {
  it( "returns image/jpeg for .jpg", () => {
    expect( mimeTypeForPath( "photo.jpg" ) ).toBe( "image/jpeg" );
  });

  it( "returns image/jpeg for .jpeg", () => {
    expect( mimeTypeForPath( "photo.jpeg" ) ).toBe( "image/jpeg" );
  });

  it( "returns image/png for .png", () => {
    expect( mimeTypeForPath( "photo.png" ) ).toBe( "image/png" );
  });

  it( "returns image/gif for .gif", () => {
    expect( mimeTypeForPath( "photo.gif" ) ).toBe( "image/gif" );
  });

  it( "returns image/webp for .webp", () => {
    expect( mimeTypeForPath( "photo.webp" ) ).toBe( "image/webp" );
  });

  it( "handles uppercase extensions", () => {
    expect( mimeTypeForPath( "photo.PNG" ) ).toBe( "image/png" );
  });
});

describe( "uploadAndPublishImage", () => {
  it( "creates an upload, creates an asset, processes, polls, and publishes", async () => {
    const mockPublishedAsset = {
      sys: { id: "asset-123" },
      fields: {
        file: { "en-US": { url: "//images.ctfassets.net/space/asset-123/photo.jpg" } },
      },
    };

    const mockProcessedAsset = {
      sys: { id: "asset-123" },
      fields: {
        file: { "en-US": { url: "//images.ctfassets.net/space/asset-123/photo.jpg" } },
      },
      publish: vi.fn().mockResolvedValue( mockPublishedAsset ),
    };

    const mockUnprocessedAsset = {
      sys: { id: "asset-123" },
      fields: { file: { "en-US": {} } },
    };

    const mockEnvironment = {
      createUpload: vi.fn().mockResolvedValue( { sys: { id: "upload-456" } } ),
      createAsset: vi.fn().mockResolvedValue( {
        sys: { id: "asset-123" },
        processForAllLocales: vi.fn().mockResolvedValue( undefined ),
      } ),
      getAsset: vi.fn()
        .mockResolvedValueOnce( mockUnprocessedAsset )
        .mockResolvedValueOnce( mockProcessedAsset ),
    };

    const tempDir = mkdtempSync( join( tmpdir(), "upload-test-" ) );
    const filePath = join( tempDir, "photo.jpg" );
    writeFileSync( filePath, "fake image data" );

    const result = await uploadAndPublishImage( mockEnvironment, filePath );

    expect( mockEnvironment.createUpload ).toHaveBeenCalledOnce();
    expect( mockEnvironment.createAsset ).toHaveBeenCalledWith( {
      fields: {
        title: { "en-US": "photo" },
        file: {
          "en-US": {
            contentType: "image/jpeg",
            fileName: "photo.jpg",
            uploadFrom: {
              sys: { type: "Link", linkType: "Upload", id: "upload-456" },
            },
          },
        },
      },
    } );
    expect( result ).toEqual( {
      filename: "photo.jpg",
      assetId: "asset-123",
      url: "https://images.ctfassets.net/space/asset-123/photo.jpg",
    } );

    rmSync( tempDir, { recursive: true, force: true } );
  });
});
