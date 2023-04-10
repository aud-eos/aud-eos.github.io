import type { Asset, Entry, EntryFields } from "contentful";

/**
 * Fields type definition for content type 'TypeAuthor'
 * @name TypeAuthorFields
 * @type {TypeAuthorFields}
 * @memberof TypeAuthor
 */
export interface TypeAuthorFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name: EntryFields.Symbol;
    /**
     * Field type definition for field 'image' (Image)
     * @name Image
     * @localized false
     */
    image?: Asset;
    /**
     * Field type definition for field 'email' (Email)
     * @name Email
     * @localized false
     */
    email?: EntryFields.Symbol;
}

/**
 * Entry type definition for content type 'author' (Author)
 * @name TypeAuthor
 * @type {TypeAuthor}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2023-04-10T06:17:51.446Z
 * @version 1
 */
export type TypeAuthor = Entry<TypeAuthorFields>;
