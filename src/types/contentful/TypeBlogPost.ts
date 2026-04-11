import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeAuthorSkeleton } from "./TypeAuthor";

export interface TypeBlogPostFields {
    title: EntryFieldTypes.Symbol;
    slug: EntryFieldTypes.Symbol;
    description: EntryFieldTypes.Text;
    image?: EntryFieldTypes.AssetLink;
    video?: EntryFieldTypes.AssetLink;
    date?: EntryFieldTypes.Date;
    body?: EntryFieldTypes.Text;
    spotifyPlaylistId?: EntryFieldTypes.Symbol;
    location?: EntryFieldTypes.Location;
    author: EntryFieldTypes.EntryLink<TypeAuthorSkeleton>;
    gallery?: EntryFieldTypes.Array<EntryFieldTypes.AssetLink>;
}

export type TypeBlogPostSkeleton = EntrySkeletonType<TypeBlogPostFields, "blogPost">;
export type TypeBlogPost<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeBlogPostSkeleton, Modifiers, Locales>;
