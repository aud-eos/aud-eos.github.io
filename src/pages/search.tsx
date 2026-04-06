import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import Fuse from "fuse.js";

import { getBlogPosts } from "@/utils/contentfulUtils";
import { Container } from "@/components/Layout/Layout";
import { Footer } from "@/components/Layout/Footer";
import { Tags } from "@/components/Tags";
import DateTimeFormat from "@/components/DateTimeFormat";
import styles from "@/styles/Home.module.scss";
import searchStyles from "@/styles/Search.module.scss";
import { META_DESCRIPTION, META_IMAGE, META_TITLE } from "@/constants";

export interface SearchPost {
  title: string;
  slug: string;
  description: string;
  body: string;
  author: string;
  tags: string[];
  date: string;
  imageUrl: string;
}

export interface SearchProps {
  posts: SearchPost[];
}

export default function Search({ posts }: SearchProps ) {
  const router = useRouter();
  const query = typeof router.query.q === "string" ? router.query.q : "";

  const fuse = useMemo(
    () =>
      new Fuse( posts, {
        keys: [
          { name: "title", weight: 3 },
          { name: "description", weight: 2 },
          { name: "author", weight: 2 },
          { name: "tags", weight: 1 },
          { name: "body", weight: 1 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true,
      }),
    [ posts ],
  );

  const results = query
    ? fuse.search( query ).map( result => result.item )
    : [];

  return (
    <>
      <Head>
        <title>Search — Audeos.com</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
        <meta name="description" content={ META_DESCRIPTION } key="desc" />
        <meta property="og:title" content={ META_TITLE } />
        <meta property="og:description" content={ META_DESCRIPTION } />
        <meta property="og:image" content={ META_IMAGE } />
      </Head>
      <Container>
        <main className={ styles.main }>
          <header>
            <Link href="/">
              <h1>Audeos.com</h1>
            </Link>
          </header>

          <section className={ searchStyles.searchResults }>
            { query && (
              <p className={ searchStyles.resultCount }>
                { results.length } result{ results.length !== 1 ? "s" : "" } for &ldquo;{ query }&rdquo;
              </p>
            ) }
            { !query && (
              <p className={ searchStyles.resultCount }>Enter a search term above.</p>
            ) }

            <ul className={ searchStyles.resultList } role="list">
              { results.map( post => (
                <li key={ post.slug }>
                  <Link href={ `/post/${post.slug}` }>
                    <h3>{ post.title }</h3>
                  </Link>
                  { post.date && <DateTimeFormat timestamp={ post.date } /> }
                  { post.description && (
                    <p>{ post.description }</p>
                  ) }
                  <Tags
                    tags={ post.tags.map( id => ({ sys: { id, type: "Link" as const, linkType: "Tag" as const } }) ) }
                  />
                </li>
              ) ) }
            </ul>
          </section>

          <Footer />
        </main>
      </Container>
    </>
  );
}

function stripMarkdown( text: string ): string {
  return text
    .replace( /```[\s\S]*?```/g, "" ) // fenced code blocks
    .replace( /`[^`]*`/g, "" ) // inline code
    .replace( /#{1,6}\s/g, "" ) // headings
    .replace( /\*\*|__|\*|_/g, "" ) // bold / italic markers
    .replace( /\[([^\]]+)\]\([^)]+\)/g, "$1" ) // links → link text only
    .replace( /^\s*[-*+>]\s/gm, "" ) // list items and blockquotes
    .replace( /\n{2,}/g, " " ) // collapse extra newlines
    .trim();
}

export async function getStaticProps() {
  const blogPosts = await getBlogPosts();

  const posts: SearchPost[] = blogPosts.items.map( post => ({
    title: post.fields.title ?? "",
    slug: post.fields.slug ?? "",
    description: post.fields.description ?? "",
    body: stripMarkdown( post.fields.body ?? "" ),
    author: post.fields.author?.fields?.name ?? "",
    tags: post.metadata.tags.map( tag => tag.sys.id ),
    date: post.fields.date ?? post.sys.createdAt,
    imageUrl: post.fields.image?.fields.file?.url ?? "",
  }) );

  return { props: { posts } };
}
