import { FC } from "react";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import { BlogPost, getBlogPost, getBlogPosts } from "@/utils/contentfulUtils";
import { SITE_URL } from "@/constants";
import styles from "@/styles/BlogPost.module.scss";
import DateTimeFormat from "@/components/DateTimeFormat";
import { Layout } from "@/components/Layout/Layout";
import { Markdown } from "@/components/Markdown";
import { Tags } from "@/components/Tags";
import { SpotifyPlaylist, getPlaylist } from "@/utils/spotify/getPlaylist";
import Playlist from "@/components/Playlist";
import Gallery, { resolveGalleryItems } from "@/components/Gallery";


const IMAGE_SIZE = 750;


export interface PostNavLink {
  slug: string
  title: string
}

export interface BlogPostViewProps {
  post: BlogPost
  playlist?: SpotifyPlaylist|null
  prevPost?: PostNavLink|null
  nextPost?: PostNavLink|null
}


export const BlogPostView: FC<BlogPostViewProps> = ({ post, playlist, prevPost, nextPost }) => {
  const metaTitle = `${post.fields.title} | Audeos.com`;
  const metaImage = `https:${post.fields.image?.fields.file?.url}?w=${IMAGE_SIZE}`;
  const metaImageDesc = post.fields.image?.fields.description || "";
  const authorProfileImageSrc = `https:${post.fields.author?.fields.image?.fields.file?.url}?w=50`;
  const authorName = post.fields.author?.fields.name;
  const canonicalUrl = `${SITE_URL}/post/${post.fields.slug}`;
  const publishedTime = post.fields.date || post.sys.createdAt;
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
      "url": SITE_URL,
    },
    "publisher": {
      "@type": "Organization",
      "name": "Audeos",
      "url": SITE_URL,
    },
  };
  return (
    <>
      <Head>
        <title>{ metaTitle }</title>
        <link rel="canonical" href={ canonicalUrl } />
        <meta name="description" content={ post.fields.description } key="desc" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={ canonicalUrl } />
        <meta property="og:title" content={ metaTitle } />
        <meta property="og:description" content={ post.fields.description } />
        <meta property="og:image" content={ metaImage } />
        <meta property="article:published_time" content={ publishedTime } />
        <meta property="article:modified_time" content={ modifiedTime } />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ metaTitle } />
        <meta name="twitter:description" content={ post.fields.description } />
        <meta name="twitter:image" content={ metaImage } />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={ { __html: JSON.stringify( jsonLd ) } }
        />
      </Head>
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
                <Image
                  src={ authorProfileImageSrc }
                  alt={ authorName || "" }
                  width="50"
                  height="50"
                  priority
                />
                <span>
                  Last updated: <DateTimeFormat timestamp={ post.sys.updatedAt } withDayName={ false } />
                  <br />
                  {
                    !!authorName &&
                      <b>
                        By <Link rel="author" href={ `/author/${post.fields.author?.fields.slug}` }>{ authorName }</Link>
                        { ` on ` } <DateTimeFormat timestamp={ post.fields.date || post.sys.createdAt } />
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
    return { props: {} };
  } else {
    const [ post, allPosts ] = await Promise.all( [
      getBlogPost( slug ),
      getBlogPosts(),
    ] );
    const playlist = post?.fields.spotifyPlaylistId
      ? await getPlaylist( post.fields.spotifyPlaylistId ) : null;

    const sortedPosts = allPosts.items
      .slice()
      .sort( ( postA, postB ) => {
        const dateA = new Date( postA.fields.date || postA.sys.createdAt ).getTime();
        const dateB = new Date( postB.fields.date || postB.sys.createdAt ).getTime();
        return dateA - dateB;
      });

    const currentIndex = sortedPosts.findIndex(
      sortedPost => sortedPost.fields.slug === slug,
    );

    const prevPostEntry = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
    const nextPostEntry = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

    const prevPost: PostNavLink | null = prevPostEntry
      ? { slug: prevPostEntry.fields.slug as string, title: prevPostEntry.fields.title as string }
      : null;
    const nextPost: PostNavLink | null = nextPostEntry
      ? { slug: nextPostEntry.fields.slug as string, title: nextPostEntry.fields.title as string }
      : null;

    return {
      props: {
        post,
        playlist,
        prevPost,
        nextPost,
      },
    };
  }
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
