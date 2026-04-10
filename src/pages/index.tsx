import Head from "next/head";
import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts, getTags } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Layout } from "@/components/Layout/Layout";
import { TagCollection } from "contentful";
import { sortTagsByName } from "@/utils/blogPostUtils";
import { GetStaticPropsContext } from "next";
import Pagination from "@/components/Home/Pagination";
import { generateFeeds } from "@/lib/generateFeeds";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";
import { capitalize } from "@/utils/stringUtils";
import { OldSchoolButton } from "@/components/OldSchoolButton";

export const PAGE_SIZE = 12;


export interface HomeProps {
  posts: BlogPosts
  tags: TagCollection
  page: number
  tagId?: string
}

export default function Home({ posts, page, tags, tagId }: HomeProps ) {
  const filteredBlogPosts = posts.items
    .filter( post => tagId === null || post.metadata.tags
      .find( tag => tag.sys.id == tagId ) );

  const isTagPage = Boolean( tagId );
  const isPaginated = page > 1;
  const tagLabel = tagId ? capitalize( tagId ) : "";

  const pageTitle = isTagPage && isPaginated
    ? `${tagLabel} — Page ${page} | Audeos.com`
    : isTagPage
      ? `${tagLabel} | Audeos.com`
      : isPaginated
        ? `Blog — Page ${page} | ${META_TITLE}`
        : META_TITLE;

  const pageDescription = isTagPage
    ? `Browse all ${tagLabel} posts on Audeos.com`
    : META_DESCRIPTION;

  const canonicalUrl = isTagPage && isPaginated
    ? `${SITE_URL}/tags/${tagId}/page/${page}`
    : isTagPage
      ? `${SITE_URL}/tags/${tagId}`
      : isPaginated
        ? `${SITE_URL}/page/${page}`
        : SITE_URL;

  return (
    <>
      <Head>
        <title>{ pageTitle }</title>
        <link rel="canonical" href={ canonicalUrl } />
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
        <meta name="description" content={ pageDescription } key="desc" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={ canonicalUrl } />
        <meta property="og:title" content={ pageTitle } />
        <meta property="og:description" content={ pageDescription } />
        <meta property="og:image" content={ META_IMAGE } />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ pageTitle } />
        <meta name="twitter:description" content={ pageDescription } />
        <meta name="twitter:image" content={ META_IMAGE } />
      </Head>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <nav>
            {
              tags.items
                .sort( sortTagsByName )
                .map( tag => {
                  const className = tag.sys.id == tagId ? styles.isTagged : "";
                  const href = tag.sys.id == tagId ? "/" : `/tags/${tag.sys.id}`;
                  return (
                    <div key={ tag.sys.id } className={ styles.navButtonWrapper }>
                      <OldSchoolButton
                        className={ className }
                        href={ href }
                        label={ tag.sys.id }
                      />
                    </div>
                  );
                })
            }
          </nav>
          <BlogPostList
            posts={ filteredBlogPosts }
            tagId={ tagId }
            page={ page }
          />
          <Pagination
            posts={ filteredBlogPosts }
            page={ page }
            tagId={ tagId }
          />
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps( context: GetStaticPropsContext ) {
  const tagId = context.params?.tagId || null;
  const page: number = Number( context.params?.page ) || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();
  generateFeeds( posts.items );
  return {
    props: {
      tagId,
      posts,
      tags,
      page,
    },
  };
}
