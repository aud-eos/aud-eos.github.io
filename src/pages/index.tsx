import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts, getTags } from "@/utils/contentfulUtils";
import { Layout } from "@/components/Layout/Layout";
import { TagCollection } from "contentful";
import TaggedPostSections from "@/components/Home/TaggedPostSections";
import { generateFeeds } from "@/lib/generateFeeds";
import { buildHomepageSchema } from "@/lib/homepageSchema";
import { JsonLd } from "@/components/JsonLd";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import { TagSeoConfigMap } from "@/types/tagConfig";
import tagSeoConfigData from "../../data/tags.json";
import { validateTagSeoConfig } from "@/utils/tagSeoConfig";

export interface HomeProps {
  posts: BlogPosts;
  tags: TagCollection;
  tagSeoConfig: TagSeoConfigMap;
  schema: ReturnType<typeof buildHomepageSchema>;
}

export default function Home({ posts, tags, tagSeoConfig, schema }: HomeProps ) {
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
          <TaggedPostSections
            posts={ posts }
            tags={ tags }
            tagSeoConfig={ tagSeoConfig }
          />
          <Link href="/page/2" className={ styles.allPostsLink }>
            Browse all posts →
          </Link>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  const posts = await getBlogPosts();
  const tags = await getTags();

  const tagSeoConfig: TagSeoConfigMap = tagSeoConfigData satisfies TagSeoConfigMap;
  const contentfulTagIds = tags.items.map( tag => tag.sys.id );
  validateTagSeoConfig( tagSeoConfig, contentfulTagIds );

  generateFeeds( posts.items );
  const schema = buildHomepageSchema( posts );

  return {
    props: {
      posts,
      tags,
      tagSeoConfig,
      schema,
    },
  };
}
