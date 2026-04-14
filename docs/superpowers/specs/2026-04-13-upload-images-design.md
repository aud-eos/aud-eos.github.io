# Upload Images to Contentful — Design Spec

## Purpose

A CLI script to upload local images to Contentful as published assets, invoked via `make upload-images DIR="..."`. Outputs structured JSON with asset metadata for use in blog post creation.

## Interface

```bash
make upload-images DIR="/path/to/images"       # Upload all images in a directory
make upload-images DIR="/path/to/image.jpg"    # Upload a single image
```

- Accepts a directory (uploads all supported images, sorted alphabetically) or a single file
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **stdout**: JSON array of `{ filename, assetId, url }` for successful uploads
- **stderr**: Progress messages and errors
- **Exit code**: 0 if all images succeed, 1 if any fail

## Upload Flow (per image)

1. Read file into a `Buffer` using `readFileSync` (not a stream — more reliable with the Contentful upload API)
2. Create upload via `environment.createUpload({ file: buffer })`
3. Create asset linking to the upload, with title derived from the filename (minus extension)
4. Process via `asset.processForAllLocales()`
5. Poll for completion — check `asset.fields.file["en-US"].url` exists
6. Publish the processed asset

## Error Handling

- **Per-image try/catch**: A failure on one image logs to stderr and continues with the rest. The final JSON output includes all successful uploads.
- **Exponential backoff on processing poll**: Start at 1s, double each attempt, cap at 10s, max 30s total wait. If processing never completes, that image counts as a failure.
- **SDK built-in retry**: `contentful-management` has `retryOnError: true` by default, handling 429 rate limits and 500 errors automatically.
- **No partial cleanup**: If an asset is created but processing fails, it remains as a draft in Contentful. Simpler than cascading delete attempts.

## Dependencies

- Add `contentful-management` as a devDependency in `package.json`
- No other new dependencies — env vars come from `.env` via the Makefile's existing `-include .env`

## Makefile Target

Uses `export` to pass env vars to the script, following the same pattern as the existing `types` target:

```makefile
upload-images:
	@export CONTENTFUL_SPACE_ID=$(CONTENTFUL_SPACE_ID) \
		CONTENTFUL_ENVIRONMENT=$(CONTENTFUL_ENVIRONMENT) \
		CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN=$(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN); \
		node scripts/upload-images.mjs "$(DIR)"
```

The script receives the directory/file path as a positional argument (no `--dir` flag needed).

## CLAUDE.md Update

Re-add the `make upload-images` documentation under the "Contentful asset management" section in CLAUDE.md.

## File Structure

```
scripts/upload-images.mjs    # The upload script (ES module)
Makefile                     # New upload-images target
CLAUDE.md                    # Updated docs
package.json / yarn.lock     # contentful-management devDependency
```
