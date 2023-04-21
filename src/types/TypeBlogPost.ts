import type { Asset, Entry, EntryFields } from "contentful";
import type { TypeAuthorFields } from "./TypeAuthor";

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
    title: EntryFields.Symbol;
    /**
     * Field type definition for field 'slug' (Slug)
     * @name Slug
     * @localized false
     */
    slug: EntryFields.Symbol;
    /**
     * Field type definition for field 'description' (Description)
     * @name Description
     * @localized true
     */
    description: EntryFields.Text;
    /**
     * Field type definition for field 'image' (Image)
     * @name Image
     * @localized false
     */
    image?: Asset;
    /**
     * Field type definition for field 'video' (Video)
     * @name Video
     * @localized false
     */
    video?: Asset;
    /**
     * Field type definition for field 'date' (Date)
     * @name Date
     * @localized false
     */
    date?: EntryFields.Date;
    /**
     * Field type definition for field 'body' (Body)
     * @name Body
     * @localized false
     */
    body?: EntryFields.Text;
    /**
     * Field type definition for field 'spotifyPlaylistId' (Spotify Playlist ID)
     * @name Spotify Playlist ID
     * @localized false
     */
    spotifyPlaylistId?: EntryFields.Symbol;
    /**
     * Field type definition for field 'location' (Location)
     * @name Location
     * @localized true
     */
    location?: EntryFields.Location;
    /**
     * Field type definition for field 'author' (Author)
     * @name Author
     * @localized false
     */
    author: Entry<TypeAuthorFields>;
}

/**
 * Entry type definition for content type 'blogPost' (Blog Post)
 * @name TypeBlogPost
 * @type {TypeBlogPost}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2023-04-01T06:07:22.846Z
 * @version 17
 */
export type TypeBlogPost = Entry<TypeBlogPostFields>;
