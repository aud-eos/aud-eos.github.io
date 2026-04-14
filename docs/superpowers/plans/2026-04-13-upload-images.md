# Upload Images to Contentful — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `make upload-images` script to reliably upload local images to Contentful as published assets.

**Architecture:** A single Node.js ES module script (`scripts/upload-images.mjs`) that reads image files, uploads each to Contentful via the Management API (buffer-based upload, not streams), processes and publishes them, and outputs JSON metadata. Invoked via a Makefile target that injects env vars from `.env`.

**Tech Stack:** Node.js (ES modules), `contentful-management` SDK, Vitest for tests, Make for task runner.

---

### Task 1: Add `contentful-management` devDependency

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock`

- [ ] **Step 1: Install the dependency**

```bash
yarn add --dev contentful-management
```

- [ ] **Step 2: Verify installation**

```bash
node -e "import('contentful-management').then(m => console.log('ok'))"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add contentful-management devDependency"
```

---

### Task 2: Write and test the image file discovery utility

**Files:**
- Create: `scripts/upload-images.mjs`
- Create: `scripts/upload-images.test.mjs`

- [ ] **Step 1: Write the failing test for `getImageFiles`**

Create `scripts/upload-images.test.mjs`:

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run scripts/upload-images.test.mjs
```

Expected: FAIL — `getImageFiles` is not exported / file doesn't exist.

- [ ] **Step 3: Write the `getImageFiles` function**

Create `scripts/upload-images.mjs`:

```javascript
#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "fs";
import { basename, extname, join } from "path";

const SUPPORTED_EXTENSIONS = new Set( [ ".jpg", ".jpeg", ".png", ".gif", ".webp" ] );

export function getImageFiles( dirOrFile ) {
  const stat = statSync( dirOrFile );
  if( stat.isFile() ) return [ dirOrFile ];

  return readdirSync( dirOrFile )
    .filter( ( name ) => SUPPORTED_EXTENSIONS.has( extname( name ).toLowerCase() ) )
    .sort()
    .map( ( name ) => join( dirOrFile, name ) );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn vitest run scripts/upload-images.test.mjs
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/upload-images.mjs scripts/upload-images.test.mjs
git commit -m "feat: add getImageFiles utility for upload script"
```

---

### Task 3: Write and test the MIME type utility

**Files:**
- Modify: `scripts/upload-images.mjs`
- Modify: `scripts/upload-images.test.mjs`

- [ ] **Step 1: Write the failing test for `mimeTypeForPath`**

Add to `scripts/upload-images.test.mjs`:

```javascript
import { getImageFiles, mimeTypeForPath } from "./upload-images.mjs";

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run scripts/upload-images.test.mjs
```

Expected: FAIL — `mimeTypeForPath` is not exported.

- [ ] **Step 3: Write `mimeTypeForPath`**

Add to `scripts/upload-images.mjs`:

```javascript
const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export function mimeTypeForPath( filePath ) {
  const extension = extname( filePath ).toLowerCase();
  return MIME_TYPES[extension];
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn vitest run scripts/upload-images.test.mjs
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/upload-images.mjs scripts/upload-images.test.mjs
git commit -m "feat: add mimeTypeForPath utility for upload script"
```

---

### Task 4: Write and test the upload-and-publish function

**Files:**
- Modify: `scripts/upload-images.mjs`
- Modify: `scripts/upload-images.test.mjs`

- [ ] **Step 1: Write the failing test for `uploadAndPublishImage`**

Add to `scripts/upload-images.test.mjs`:

```javascript
import { getImageFiles, mimeTypeForPath, uploadAndPublishImage } from "./upload-images.mjs";

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run scripts/upload-images.test.mjs
```

Expected: FAIL — `uploadAndPublishImage` is not exported.

- [ ] **Step 3: Write `uploadAndPublishImage`**

Add to `scripts/upload-images.mjs`:

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn vitest run scripts/upload-images.test.mjs
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/upload-images.mjs scripts/upload-images.test.mjs
git commit -m "feat: add uploadAndPublishImage with exponential backoff polling"
```

---

### Task 5: Write and test the `main` function

**Files:**
- Modify: `scripts/upload-images.mjs`
- Modify: `scripts/upload-images.test.mjs`

- [ ] **Step 1: Write the failing test for `main`**

Add to `scripts/upload-images.test.mjs`:

```javascript
import { main } from "./upload-images.mjs";

describe( "main", () => {
  it( "exits with code 1 when no directory argument is provided", async () => {
    const mockExit = vi.spyOn( process, "exit" ).mockImplementation( () => {} );
    const mockStderr = vi.spyOn( process.stderr, "write" ).mockImplementation( () => {} );

    await main( [] );

    expect( mockExit ).toHaveBeenCalledWith( 1 );
    expect( mockStderr ).toHaveBeenCalledWith(
      expect.stringContaining( "Usage:" ),
    );

    mockExit.mockRestore();
    mockStderr.mockRestore();
  });

  it( "exits with code 1 when required env vars are missing", async () => {
    const mockExit = vi.spyOn( process, "exit" ).mockImplementation( () => {} );
    const mockStderr = vi.spyOn( process.stderr, "write" ).mockImplementation( () => {} );

    const originalEnv = { ...process.env };
    delete process.env.CONTENTFUL_SPACE_ID;
    delete process.env.CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN;

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
yarn vitest run scripts/upload-images.test.mjs
```

Expected: FAIL — `main` is not exported.

- [ ] **Step 3: Write the `main` function**

Add to `scripts/upload-images.mjs`:

```javascript
import contentfulManagement from "contentful-management";

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
yarn vitest run scripts/upload-images.test.mjs
```

Expected: All tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
yarn test
```

Expected: All tests PASS, no regressions.

- [ ] **Step 6: Commit**

```bash
git add scripts/upload-images.mjs scripts/upload-images.test.mjs
git commit -m "feat: add main function with per-image error handling"
```

---

### Task 6: Add Makefile target and update CLAUDE.md

**Files:**
- Modify: `Makefile`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add the `upload-images` target to the Makefile**

Add after the `types` target in `Makefile`:

```makefile
# Upload images from a local directory (or single file) to Contentful.
# Outputs a JSON array of { filename, assetId, url } to stdout.
# Usage:
#   make upload-images DIR="/path/to/images"
#   make upload-images DIR="/path/to/single-image.jpg"
upload-images:
	@export CONTENTFUL_SPACE_ID=$(CONTENTFUL_SPACE_ID) \
		CONTENTFUL_ENVIRONMENT=$(CONTENTFUL_ENVIRONMENT) \
		CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN=$(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN); \
		node scripts/upload-images.mjs "$(DIR)"
```

- [ ] **Step 2: Update CLAUDE.md with upload-images documentation**

Add after the "Dependency management (Makefile)" section in `CLAUDE.md`:

```markdown
Contentful asset management (Makefile):

\`\`\`bash
make upload-images DIR="/path/to/dir"         # Upload all images in a directory to Contentful
make upload-images DIR="/path/to/image.jpg"   # Upload a single image to Contentful
\`\`\`

Outputs a JSON array of `{ filename, assetId, url }` to stdout. Reads credentials from `.env` automatically. Always rename images to descriptive filenames before uploading.
```

- [ ] **Step 3: Run lint to verify formatting**

```bash
yarn format
```

- [ ] **Step 4: Verify the Makefile target parses correctly**

```bash
make -n upload-images DIR="/tmp/test"
```

Expected: Prints the commands it would run, no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add Makefile CLAUDE.md
git commit -m "feat: add make upload-images target and docs"
```

---

### Task 7: Manual integration test

- [ ] **Step 1: Create a test image**

```bash
convert -size 100x100 xc:red /tmp/test-upload.jpg 2>/dev/null || \
  printf '\xff\xd8\xff\xe0' > /tmp/test-upload.jpg
```

- [ ] **Step 2: Run the upload**

```bash
make upload-images DIR="/tmp/test-upload.jpg"
```

Expected: JSON output with `filename`, `assetId`, and `url` fields. Asset visible in Contentful.

- [ ] **Step 3: Verify the asset in Contentful**

Check that the asset is published and the URL resolves to an image.

- [ ] **Step 4: Clean up test asset in Contentful**

Delete the test asset from the Contentful UI.
