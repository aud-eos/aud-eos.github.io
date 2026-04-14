// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { getImageFiles, mimeTypeForPath, uploadAndPublishImage, main } from "./upload-images.mjs";

describe( "getImageFiles", () => {
  let tempDir;

  beforeEach( () => {
    tempDir = mkdtempSync( join( tmpdir(), "upload-test-" ) );
  });

  afterEach( () => {
    rmSync( tempDir, { recursive: true, force: true });
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
  let tempDir;

  beforeEach( () => {
    tempDir = mkdtempSync( join( tmpdir(), "upload-test-" ) );
  });

  afterEach( () => {
    rmSync( tempDir, { recursive: true, force: true });
  });

  it( "creates an upload, creates an asset, processes, polls, and publishes", async () => {
    const createdAsset = {
      sys: { id: "asset-123" },
      fields: {
        title: { "en-US": "photo" },
        file: { "en-US": { contentType: "image/jpeg", fileName: "photo.jpg" } },
      },
    };

    const unprocessedAsset = {
      sys: { id: "asset-123" },
      fields: { file: { "en-US": {} } },
    };

    const processedAsset = {
      sys: { id: "asset-123" },
      fields: {
        file: { "en-US": { url: "//images.ctfassets.net/space/asset-123/photo.jpg" } },
      },
    };

    const publishedAsset = {
      sys: { id: "asset-123" },
      fields: {
        file: { "en-US": { url: "//images.ctfassets.net/space/asset-123/photo.jpg" } },
      },
    };

    const mockClient = {
      upload: {
        create: vi.fn().mockResolvedValue({ sys: { id: "upload-456" } }),
      },
      asset: {
        create: vi.fn().mockResolvedValue( createdAsset ),
        processForAllLocales: vi.fn().mockResolvedValue( undefined ),
        get: vi.fn()
          .mockResolvedValueOnce( unprocessedAsset )
          .mockResolvedValueOnce( processedAsset ),
        publish: vi.fn().mockResolvedValue( publishedAsset ),
      },
    };

    const filePath = join( tempDir, "photo.jpg" );
    writeFileSync( filePath, "fake image data" );

    const result = await uploadAndPublishImage( mockClient, filePath );

    expect( mockClient.upload.create ).toHaveBeenCalledOnce();
    expect( mockClient.asset.create ).toHaveBeenCalledWith(
      {},
      {
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
      },
    );
    expect( mockClient.asset.processForAllLocales ).toHaveBeenCalledOnce();
    expect( mockClient.asset.publish ).toHaveBeenCalledOnce();
    expect( result ).toEqual({
      filename: "photo.jpg",
      assetId: "asset-123",
      url: "https://images.ctfassets.net/space/asset-123/photo.jpg",
    });
  });
});

describe( "main", () => {
  it( "exits with code 1 when no directory argument is provided", async () => {
    const mockExit = vi.spyOn( process, "exit" ).mockImplementation( () => {});
    const mockStderr = vi.spyOn( process.stderr, "write" ).mockImplementation( () => {});

    await main( [] );

    expect( mockExit ).toHaveBeenCalledWith( 1 );
    expect( mockStderr ).toHaveBeenCalledWith(
      expect.stringContaining( "Usage:" ),
    );

    mockExit.mockRestore();
    mockStderr.mockRestore();
  });

  it( "exits with code 1 when required env vars are missing", async () => {
    const mockExit = vi.spyOn( process, "exit" ).mockImplementation( () => {});
    const mockStderr = vi.spyOn( process.stderr, "write" ).mockImplementation( () => {});

    const originalEnv = { ...process.env };
    delete process.env.CONTENTFUL_SPACE_ID;
    delete process.env.CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN;
    delete process.env.CONTENTFUL_ENVIRONMENT;

    await main( [ "/some/path" ] );

    expect( mockExit ).toHaveBeenCalledWith( 1 );
    expect( mockStderr ).toHaveBeenCalledWith(
      expect.stringContaining( "CONTENTFUL_SPACE_ID" ),
    );

    process.env = originalEnv;
    mockExit.mockRestore();
    mockStderr.mockRestore();
  });
});
