import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts } from "@/utils/contentfulUtils";
import { Layout } from "@/components/Layout/Layout";
import CategoryPostSections from "@/components/Home/CategoryPostSections";
import NowPlayingCard from "@/components/NowPlaying/NowPlayingCard";
import { generateFeeds } from "@/lib/generateFeeds";
import { buildHomepageSchema } from "@/lib/homepageSchema";
import { JsonLd } from "@/components/JsonLd";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";

export interface HomeProps {
  posts: BlogPosts;
  categoryConfig: CategoryConfigMap;
  schema: ReturnType<typeof buildHomepageSchema>;
}

export default function Home({ posts, categoryConfig, schema }: HomeProps ) {
  return (
    <>
      <SeoHead
        title={ META_TITLE }
        canonicalUrl={ SITE_URL }
        description={ META_DESCRIPTION }
        ogImage={ META_IMAGE }
      >
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
        <JsonLd schema={ schema } />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <NowPlayingCard />
          <CategoryPostSections
            posts={ posts }
            categoryConfig={ categoryConfig }
          />
          <Link href="/page/1" className={ styles.allPostsLink }>
            Browse all posts →
          </Link>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  const posts = await getBlogPosts();

  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  generateFeeds( posts.items );
  const schema = buildHomepageSchema( posts, categoryConfig );

  return {
    props: {
      posts,
      categoryConfig,
      schema,
    },
  };
}
