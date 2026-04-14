import { FC } from "react";
import { GetStaticPropsContext } from "next";
import Link from "next/link";
import Image from "next/image";

import { BlogPost, getBlogPost, getBlogPosts } from "@/utils/contentfulUtils";
import { resolvePostDate, sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { SITE_URL, CONTENT_IMAGE_WIDTH } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import styles from "@/styles/BlogPost.module.scss";
import DateTimeFormat from "@/components/DateTimeFormat";
import { Layout } from "@/components/Layout/Layout";
import { Markdown } from "@/components/Markdown";
import { Tags } from "@/components/Tags";
import { SpotifyPlaylist, getPlaylist } from "@/utils/spotify/getPlaylist";
import Playlist from "@/components/Playlist";
import Gallery, { resolveGalleryItems } from "@/components/Gallery";
import { getOembed, SoundCloudOembed } from "@/utils/soundcloud/getOembed";
import { SoundCloudEmbed } from "@/components/SoundCloudEmbed";




export interface PostNavLink {
  slug: string
  title: string
}

export interface BlogPostViewProps {
  post: BlogPost
  playlist?: SpotifyPlaylist|null
  soundCloudOembed?: SoundCloudOembed|null
  prevPost?: PostNavLink|null
  nextPost?: PostNavLink|null
}


export const BlogPostView: FC<BlogPostViewProps> = ({ post, playlist, soundCloudOembed, prevPost, nextPost }) => {
  const metaTitle = `${post.fields.title} | Audeos.com`;
  const metaImage = `https:${post.fields.image?.fields.file?.url}?w=${CONTENT_IMAGE_WIDTH}`;
  const metaImageDesc = post.fields.image?.fields.description || "";
  const authorImageUrl = post.fields.author?.fields.image?.fields.file?.url;
  const authorProfileImageSrc = authorImageUrl ? `https:${authorImageUrl}?w=50` : null;
  const authorName = post.fields.author?.fields.name;
  const authorSlug = post.fields.author?.fields.slug;
  const canonicalUrl = `${SITE_URL}/post/${post.fields.slug}`;
  const publishedTime = resolvePostDate( post );
  const modifiedTime = post.sys.updatedAt;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.fields.title,
    "description": post.fields.description,
    "image": metaImage,
    "url": canonicalUrl,
    "datePublished": publishedTime,
    "dateModified": modifiedTime,
    "author": {
      "@type": "Person",
      "name": authorName,
      "url": authorSlug ? `${SITE_URL}/author/${authorSlug}` : SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Audeos",
      "url": SITE_URL,
    },
  };
  return (
    <>
      <SeoHead
        title={ metaTitle }
        canonicalUrl={ canonicalUrl }
        description={ post.fields.description ?? "" }
        ogType="article"
        ogImage={ metaImage }
      >
        <meta property="article:published_time" content={ publishedTime } />
        <meta property="article:modified_time" content={ modifiedTime } />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={ { __html: JSON.stringify( jsonLd ) } }
        />
      </SeoHead>
      <Layout>
        <main className={ styles.main }>
          <article>
            <header>
              <figure>
                <Image
                  src={ metaImage }
                  alt={ metaImageDesc }
                  fill
                  priority
                />
                <figcaption>
                  { metaImageDesc }
                </figcaption>
              </figure>
              <h1>{ post.fields.title }</h1>
              <address>
                { authorProfileImageSrc && (
                  authorSlug
                    ? <Link href={ `/author/${authorSlug}` }>
                      <Image
                        src={ authorProfileImageSrc }
                        alt={ authorName || "" }
                        width="50"
                        height="50"
                        priority
                      />
                    </Link>
                    : <Image
                      src={ authorProfileImageSrc }
                      alt={ authorName || "" }
                      width="50"
                      height="50"
                      priority
                    />
                ) }
                <span>
                  Last updated: <DateTimeFormat timestamp={ post.sys.updatedAt } withDayName={ false } />
                  <br />
                  {
                    !!authorName &&
                      <b>
                        By { authorSlug
                          ? <Link rel="author" href={ `/author/${authorSlug}` }>{ authorName }</Link>
                          : authorName
                        }
                        { ` on ` } <DateTimeFormat timestamp={ resolvePostDate( post ) } />
                      </b>
                  }
                </span>
              </address>
              <Tags tags={ post.metadata.tags } />
              <p>
                { post.fields.description }
              </p>
            </header>
            <Markdown>{ post.fields.body || "" }</Markdown>
            <Gallery items={ resolveGalleryItems( post.fields.gallery ) } />
            { playlist && <Playlist playlist={ playlist } /> }
            { soundCloudOembed && <SoundCloudEmbed oembed={ soundCloudOembed } /> }
            { ( prevPost || nextPost ) && (
              <nav className={ styles.postNav }>
                { nextPost && (
                  <Link href={ `/post/${nextPost.slug}` } className={ styles.nextPost }>
                    <span>← Newer</span>
                    <span>{ nextPost.title }</span>
                  </Link>
                ) }
                { prevPost && (
                  <Link href={ `/post/${prevPost.slug}` } className={ styles.prevPost }>
                    <span>Older →</span>
                    <span>{ prevPost.title }</span>
                  </Link>
                ) }
              </nav>
            ) }
          </article>
        </main>
      </Layout>
    </>
  );
};


export async function getStaticProps( context: GetStaticPropsContext ) {
  const slug = context.params?.slug;
  if( typeof slug !== "string" ) {
    return { notFound: true };
  }

  const [ post, allPosts ] = await Promise.all( [
    getBlogPost( slug ),
    getBlogPosts(),
  ] );

  if( !post ) {
    return { notFound: true };
  }

  const playlist = post.fields.spotifyPlaylistId
    ? await getPlaylist( post.fields.spotifyPlaylistId ) : null;

  const soundCloudOembed = post.fields.soundcloudUrl
    ? await getOembed( post.fields.soundcloudUrl ) : null;

  const sortedPosts = allPosts.items
    .slice()
    .sort( sortBlogPostsByDate )
    .reverse();

  const currentIndex = sortedPosts.findIndex(
    sortedPost => sortedPost.fields.slug === slug,
  );

  const prevPostEntry = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPostEntry = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  const prevPost: PostNavLink | null = prevPostEntry
    ? { slug: prevPostEntry.fields.slug, title: prevPostEntry.fields.title }
    : null;
  const nextPost: PostNavLink | null = nextPostEntry
    ? { slug: nextPostEntry.fields.slug, title: nextPostEntry.fields.title }
    : null;

  return {
    props: {
      post,
      playlist,
      soundCloudOembed,
      prevPost,
      nextPost,
    },
  };
}

export async function getStaticPaths() {
  const posts = await getBlogPosts();

  // Map the result of that query to a list of slugs.
  // This will give Next the list of all blog post pages that need to be
  // rendered at build time.
  const paths = posts.items.map( post => {
    const slug = post.fields.slug;
    return { params: { slug } };
  });

  return {
    paths,
    fallback: false,
  };
}

export default BlogPostView;
