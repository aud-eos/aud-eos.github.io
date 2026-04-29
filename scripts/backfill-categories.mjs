#!/usr/bin/env node

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "contentful-management";

const CATEGORY_PRIORITY = [ "music", "events", "lifestyle" ];

const TAG_TO_CATEGORY = {
  releases: "music",
  edits: "music",
  radio: "music",
  playlists: "music",
  dj: "events",
  nightlife: "events",
  plantlife: "lifestyle",
  merch: "lifestyle",
  graphics: "lifestyle",
  technology: "lifestyle",
};

const LOCALE = "en-US";
const PACING_MS = 150;
const CATEGORY_FIELD = "category";

export function resolveCategoryForTags( tagIds ) {
  const candidateCategories = new Set();
  for( const tagId of tagIds ) {
    const category = TAG_TO_CATEGORY[tagId];
    if( category ) candidateCategories.add( category );
  }
  for( const priority of CATEGORY_PRIORITY ) {
    if( candidateCategories.has( priority ) ) return priority;
  }
  return null;
}

async function fetchAllEntries( client ) {
  const all = [];
  let skip = 0;
  const limit = 100;
  while ( true ) {
    const page = await client.entry.getMany({
      query: { content_type: "blogPost", limit, skip, order: "sys.createdAt" },
    });
    all.push( ...page.items );
    if( page.items.length < limit ) break;
    skip += limit;
  }
  return all;
}

function planFor( entry ) {
  const slug = entry.fields.slug?.[LOCALE] ?? entry.sys.id;
  const tagIds = ( entry.metadata?.tags ?? [] ).map( tag => tag.sys.id );
  const category = resolveCategoryForTags( tagIds );
  return { slug, tagIds, category, entry };
}

function printDryRun( plans ) {
  const unmapped = plans.filter( plan => plan.category === null );
  if( unmapped.length > 0 ) {
    process.stderr.write( `\nError: ${unmapped.length} post(s) cannot be categorized:\n` );
    for( const plan of unmapped ) {
      const reason = plan.tagIds.length === 0
        ? "no tags"
        : `tags [${plan.tagIds.join( ", " )}] are not in TAG_TO_CATEGORY`;
      process.stderr.write( `  ${plan.slug.padEnd( 40 )} ${reason}\n` );
    }
    process.stderr.write( "\nFix these in Contentful or extend the script's TAG_TO_CATEGORY map, then re-run.\n" );
    process.exit( 1 );
  }

  process.stdout.write( `Backfill plan (${plans.length} posts):\n\n` );
  process.stdout.write( "slug".padEnd( 40 ) + "category".padEnd( 12 ) + "via tag\n" );
  for( const plan of plans ) {
    const sourceTag = Object
      .entries( TAG_TO_CATEGORY )
      .find( ( [ tagId, category ] ) => category === plan.category && plan.tagIds.includes( tagId ) )?.[0]
      ?? "?";
    process.stdout.write(
      plan.slug.padEnd( 40 ) + plan.category.padEnd( 12 ) + sourceTag + "\n",
    );
  }

  const counts = { music: 0, events: 0, lifestyle: 0 };
  for( const plan of plans ) counts[plan.category]++;
  process.stdout.write( "\nSummary:\n" );
  for( const category of CATEGORY_PRIORITY ) {
    process.stdout.write( `  ${category.padEnd( 10 )} ${counts[category]}\n` );
  }
  process.stdout.write( "\nNo changes written. Re-run with --apply to write.\n" );
}

async function applyBackfill( client, plans ) {
  process.stdout.write( `Applying (${plans.length} posts)...\n` );
  const failures = [];
  for( const [ index, plan ] of plans.entries() ) {
    const label = `[${index + 1}/${plans.length}] ${plan.slug.padEnd( 40 )} → ${plan.category.padEnd( 10 )}`;
    try {
      const fresh = await client.entry.get({ entryId: plan.entry.sys.id });
      fresh.fields[CATEGORY_FIELD] = { ...( fresh.fields[CATEGORY_FIELD] ?? {}), [LOCALE]: plan.category };
      const updated = await client.entry.update(
        { entryId: fresh.sys.id },
        fresh,
      );
      const wasPublished = fresh.sys.publishedVersion !== undefined;
      if( wasPublished ) {
        await client.entry.publish({ entryId: updated.sys.id }, updated );
      }
      process.stdout.write( `${label} ✓\n` );
    } catch ( error ) {
      process.stdout.write( `${label} ✗ ${error.message}\n` );
      failures.push({ slug: plan.slug, error: error.message });
    }
    await new Promise( resolve => setTimeout( resolve, PACING_MS ) );
  }

  process.stdout.write( `\nDone. ${plans.length - failures.length} posts updated. ${failures.length} failures.\n` );
  if( failures.length > 0 ) {
    for( const failure of failures ) {
      process.stderr.write( `  - ${failure.slug}: ${failure.error}\n` );
    }
    process.stderr.write( "\nRe-run `make backfill-categories-apply` to retry failed posts (script is idempotent).\n" );
    process.exit( 1 );
  }
}

export async function main( args ) {
  const scriptDir = dirname( fileURLToPath( import.meta.url ) );
  const categoriesPath = join( scriptDir, "..", "data", "categories.json" );
  const categoryConfig = JSON.parse( readFileSync( categoriesPath, "utf8" ) );
  const validCategoryIds = new Set( Object.keys( categoryConfig ) );

  for( const [ tagId, category ] of Object.entries( TAG_TO_CATEGORY ) ) {
    if( !validCategoryIds.has( category ) ) {
      process.stderr.write(
        `Configuration error: TAG_TO_CATEGORY["${tagId}"] = "${category}" is not a key in data/categories.json\n`,
      );
      process.exit( 1 );
      return;
    }
  }

  for( const category of CATEGORY_PRIORITY ) {
    if( !validCategoryIds.has( category ) ) {
      process.stderr.write(
        `Configuration error: CATEGORY_PRIORITY entry "${category}" is not a key in data/categories.json\n`,
      );
      process.exit( 1 );
      return;
    }
  }

  const apply = args.includes( "--apply" );

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT;

  if( !spaceId || !accessToken || !environmentId ) {
    process.stderr.write(
      "Missing required env vars: CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN, CONTENTFUL_ENVIRONMENT\n",
    );
    process.exit( 1 );
    return;
  }

  const client = createClient(
    { accessToken },
    { type: "plain", defaults: { spaceId, environmentId } },
  );

  process.stderr.write( "Fetching all blog post entries...\n" );
  const entries = await fetchAllEntries( client );
  process.stderr.write( `Fetched ${entries.length} entries.\n\n` );

  const plans = entries.map( planFor );

  if( !apply ) {
    printDryRun( plans );
    return;
  }

  const unmapped = plans.filter( plan => plan.category === null );
  if( unmapped.length > 0 ) {
    process.stderr.write( `Error: ${unmapped.length} post(s) cannot be categorized. Run dry-run first to see details.\n` );
    process.exit( 1 );
    return;
  }

  await applyBackfill( client, plans );
}

if( process.argv[1] === fileURLToPath( import.meta.url ) ) {
  main( process.argv.slice( 2 ) );
}
