import { FC } from "react";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Image from "next/image";
import { Author, getAuthor, getAuthors } from "@/utils/contentfulUtils";
import { SITE_URL } from "@/constants";
import { stripMarkdown } from "@/utils/stringUtils";
import styles from "@/styles/Author.module.scss";
import { Layout } from "@/components/Layout/Layout";
import { Markdown } from "@/components/Markdown";

const AVATAR_SIZE = 80;
const OG_IMAGE_SIZE = 1200;

export interface AuthorPageProps {
  author: Author
}

export const AuthorPage: FC<AuthorPageProps> = ({ author }) => {
  const authorName = author.fields.name;
  const avatarUrl = author.fields.image?.fields.file?.url;
  const avatarSrc = avatarUrl ? `https:${avatarUrl}?w=${AVATAR_SIZE}` : null;
  const ogImageSrc = avatarUrl ? `https:${avatarUrl}?w=${OG_IMAGE_SIZE}` : null;
  const bio = author.fields.bio || "";
  const metaDescription = stripMarkdown( bio ).slice( 0, 160 ) || `Posts by ${authorName} on Audeos.com`;
  const metaTitle = `${authorName} | Audeos.com`;
  const canonicalUrl = `${SITE_URL}/author/${author.fields.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": authorName,
    "url": canonicalUrl,
    ...( ogImageSrc && { "image": ogImageSrc }),
  };

  return (
    <>
      <Head>
        <title>{ metaTitle }</title>
        <link rel="canonical" href={ canonicalUrl } />
        <link rel="icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={ metaDescription } key="desc" />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={ canonicalUrl } />
        <meta property="og:title" content={ metaTitle } />
        <meta property="og:description" content={ metaDescription } />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={ metaTitle } />
        <meta name="twitter:description" content={ metaDescription } />
        { ogImageSrc && <meta property="og:image" content={ ogImageSrc } /> }
        { ogImageSrc && <meta name="twitter:image" content={ ogImageSrc } /> }
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={ { __html: JSON.stringify( jsonLd ) } }
        />
      </Head>
      <Layout>
        <main className={ styles.main }>
          <article>
            <header>
              { avatarSrc && (
                <Image
                  src={ avatarSrc }
                  alt={ `Profile photo of ${authorName}` }
                  width={ AVATAR_SIZE }
                  height={ AVATAR_SIZE }
                  priority
                />
              ) }
              <h1>{ authorName }</h1>
            </header>
            <Markdown>{ bio }</Markdown>
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
  const author = await getAuthor( slug );
  if( !author ) {
    return { notFound: true };
  }
  return {
    props: { author },
  };
}

export async function getStaticPaths() {
  const authors = await getAuthors();
  const paths = authors.items.map( author => ({
    params: { slug: author.fields.slug as string },
  }) );
  return {
    paths,
    fallback: false,
  };
}

export default AuthorPage;
