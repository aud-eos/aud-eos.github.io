#!/usr/bin/env node

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { createClient } from "contentful-management";

export async function applyEntryUpdate( client, update ) {
  const entry = await client.entry.get({ entryId: update.entryId });
  const currentTagIds = new Set(
    ( entry.metadata?.tags || [] ).map( tag => tag.sys.id ),
  );

  for( const tagId of update.tagsToAdd || [] ) {
    currentTagIds.add( tagId );
  }
  for( const tagId of update.tagsToRemove || [] ) {
    currentTagIds.delete( tagId );
  }

  entry.metadata = {
    ...entry.metadata,
    tags: [ ...currentTagIds ].sort().map( tagId => ({
      sys: { type: "Link", linkType: "Tag", id: tagId },
    }) ),
  };

  return await client.entry.update({ entryId: update.entryId }, entry );
}

export async function publishEntry( client, entryId ) {
  const entry = await client.entry.get({ entryId });
  return await client.entry.publish({ entryId }, entry );
}

export async function deleteTag( client, tagId ) {
  const tag = await client.tag.get({ tagId });
  return await client.tag.delete({ tagId, version: tag.sys.version });
}

export async function main( args ) {
  const planPath = args[0];
  if( !planPath ) {
    process.stderr.write( "Usage: node scripts/migrate-tags.mjs <plan.json>\n" );
    process.exit( 1 );
    return;
  }

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

  const plan = JSON.parse( readFileSync( planPath, "utf8" ) );
  const updates = plan.updates || [];
  const tagDeletions = plan.tagDeletions || [];

  const client = createClient(
    { accessToken },
    {
      type: "plain",
      defaults: { spaceId, environmentId },
    },
  );

  process.stderr.write( `Plan: ${plan.description || "(no description)"}\n` );
  process.stderr.write( `Applying ${updates.length} entry update(s) + ${tagDeletions.length} tag deletion(s)\n\n` );

  const updateFailures = [];
  const publishFailures = [];
  const updatedEntryIds = [];

  for( const [ index, update ] of updates.entries() ) {
    const label = update.title ? `${update.entryId} (${update.title})` : update.entryId;
    process.stderr.write( `  [${index + 1}/${updates.length}] update ${label}...` );
    try {
      await applyEntryUpdate( client, update );
      updatedEntryIds.push( update.entryId );
      process.stderr.write( " done\n" );
    } catch ( error ) {
      process.stderr.write( ` FAILED: ${error.message}\n` );
      updateFailures.push({ entryId: update.entryId, title: update.title, error: error.message });
    }
  }

  process.stderr.write( `\nPublishing ${updatedEntryIds.length} updated entries...\n` );
  for( const [ index, entryId ] of updatedEntryIds.entries() ) {
    process.stderr.write( `  [${index + 1}/${updatedEntryIds.length}] publish ${entryId}...` );
    try {
      await publishEntry( client, entryId );
      process.stderr.write( " done\n" );
    } catch ( error ) {
      process.stderr.write( ` FAILED: ${error.message}\n` );
      publishFailures.push({ entryId, error: error.message });
    }
  }

  const tagDeletionFailures = [];
  if( tagDeletions.length > 0 ) {
    process.stderr.write( `\nDeleting ${tagDeletions.length} tag(s)...\n` );
    for( const tagId of tagDeletions ) {
      process.stderr.write( `  - ${tagId}...` );
      try {
        await deleteTag( client, tagId );
        process.stderr.write( " done\n" );
      } catch ( error ) {
        process.stderr.write( ` FAILED: ${error.message}\n` );
        tagDeletionFailures.push({ tagId, error: error.message });
      }
    }
  }

  process.stderr.write( `\nSummary:\n` );
  process.stderr.write( `  Updates: ${updates.length - updateFailures.length} succeeded, ${updateFailures.length} failed\n` );
  process.stderr.write( `  Publishes: ${updatedEntryIds.length - publishFailures.length} succeeded, ${publishFailures.length} failed\n` );
  process.stderr.write( `  Tag deletions: ${tagDeletions.length - tagDeletionFailures.length} succeeded, ${tagDeletionFailures.length} failed\n` );

  const totalFailures = updateFailures.length + publishFailures.length + tagDeletionFailures.length;
  process.exit( totalFailures > 0 ? 1 : 0 );
}

if( process.argv[1] === fileURLToPath( import.meta.url ) ) {
  main( process.argv.slice( 2 ) );
}
