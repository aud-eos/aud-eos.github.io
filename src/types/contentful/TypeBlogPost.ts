import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeAuthorSkeleton } from "./TypeAuthor";

/**
 * Fields type definition for content type 'TypeBlogPost'
 * @name TypeBlogPostFields
 * @type {TypeBlogPostFields}
 * @memberof TypeBlogPost
 */
export interface TypeBlogPostFields {
    /**
     * Field type definition for field 'title' (Title)
     * @name Title
     * @localized true
     */
    title: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'slug' (Slug)
     * @name Slug
     * @localized false
     */
    slug: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'description' (Description)
     * @name Description
     * @localized true
     */
    description: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'image' (Image)
     * @name Image
     * @localized false
     */
    image?: EntryFieldTypes.AssetLink;
    /**
     * Field type definition for field 'video' (Video)
     * @name Video
     * @localized false
     */
    video?: EntryFieldTypes.AssetLink;
    /**
     * Field type definition for field 'date' (Date)
     * @name Date
     * @localized false
     */
    date?: EntryFieldTypes.Date;
    /**
     * Field type definition for field 'body' (Body)
     * @name Body
     * @localized false
     */
    body?: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'spotifyPlaylistId' (Spotify Playlist ID)
     * @name Spotify Playlist ID
     * @localized false
     */
    spotifyPlaylistId?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'location' (Location)
     * @name Location
     * @localized true
     */
    location?: EntryFieldTypes.Location;
    /**
     * Field type definition for field 'author' (Author)
     * @name Author
     * @localized false
     */
    author: EntryFieldTypes.EntryLink<TypeAuthorSkeleton>;
}

/**
 * Entry skeleton type definition for content type 'blogPost' (Blog Post)
 * @name TypeBlogPostSkeleton
 * @type {TypeBlogPostSkeleton}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2023-04-01T06:07:22.846Z
 * @version 17
 */
export type TypeBlogPostSkeleton = EntrySkeletonType<TypeBlogPostFields, "blogPost">;
/**
 * Entry type definition for content type 'blogPost' (Blog Post)
 * @name TypeBlogPost
 * @type {TypeBlogPost}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2023-04-01T06:07:22.846Z
 * @version 17
 */
export type TypeBlogPost<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeBlogPostSkeleton, Modifiers, Locales>;

export function isTypeBlogPost<Modifiers extends ChainModifiers, Locales extends LocaleCode>( entry: Entry<EntrySkeletonType, Modifiers, Locales> ): entry is TypeBlogPost<Modifiers, Locales>{
    return entry.sys.contentType.sys.id === "blogPost";
}

export type TypeBlogPostWithoutLinkResolutionResponse = TypeBlogPost<"WITHOUT_LINK_RESOLUTION">;
export type TypeBlogPostWithoutUnresolvableLinksResponse = TypeBlogPost<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeBlogPostWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeBlogPost<"WITH_ALL_LOCALES", Locales>;
export type TypeBlogPostWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeBlogPost<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeBlogPostWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeBlogPost<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
