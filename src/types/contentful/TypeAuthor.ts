import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

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
    name: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'image' (Image)
     * @name Image
     * @localized false
     */
    image?: EntryFieldTypes.AssetLink;
    /**
     * Field type definition for field 'email' (Email)
     * @name Email
     * @localized false
     */
    email?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'slug' (slug)
     * @name slug
     * @localized false
     */
    slug: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'bio' (bio)
     * @name bio
     * @localized false
     */
    bio?: EntryFieldTypes.Text;
}

/**
 * Entry skeleton type definition for content type 'author' (Author)
 * @name TypeAuthorSkeleton
 * @type {TypeAuthorSkeleton}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2023-04-10T06:17:51.446Z
 * @version 3
 */
export type TypeAuthorSkeleton = EntrySkeletonType<TypeAuthorFields, "author">;
/**
 * Entry type definition for content type 'author' (Author)
 * @name TypeAuthor
 * @type {TypeAuthor}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2023-04-10T06:17:51.446Z
 * @version 3
 */
export type TypeAuthor<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeAuthorSkeleton, Modifiers, Locales>;

export function isTypeAuthor<Modifiers extends ChainModifiers, Locales extends LocaleCode>( entry: unknown ): entry is TypeAuthor<Modifiers, Locales> {
  const candidate = entry as { sys?: { contentType?: { sys?: { id?: string } } } };
  return candidate.sys?.contentType?.sys?.id === "author";
}

export type TypeAuthorWithoutLinkResolutionResponse = TypeAuthor<"WITHOUT_LINK_RESOLUTION">;
export type TypeAuthorWithoutUnresolvableLinksResponse = TypeAuthor<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeAuthorWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeAuthor<"WITH_ALL_LOCALES", Locales>;
export type TypeAuthorWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeAuthor<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeAuthorWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeAuthor<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
