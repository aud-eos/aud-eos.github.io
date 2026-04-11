import Head from "next/head";
import { FC, ReactNode } from "react";

export interface SeoHeadProps {
  title: string
  canonicalUrl: string
  description: string
  ogType?: string
  ogImage?: string
  twitterCard?: "summary" | "summary_large_image"
  children?: ReactNode
}

export const SeoHead: FC<SeoHeadProps> = ({
  title,
  canonicalUrl,
  description,
  ogType = "website",
  ogImage,
  twitterCard = "summary_large_image",
  children,
}) => (
  <Head>
    <title>{ title }</title>
    <link rel="canonical" href={ canonicalUrl } />
    <meta name="description" content={ description } key="desc" />
    <meta property="og:type" content={ ogType } />
    <meta property="og:url" content={ canonicalUrl } />
    <meta property="og:title" content={ title } />
    <meta property="og:description" content={ description } />
    { ogImage && <meta property="og:image" content={ ogImage } /> }
    <meta name="twitter:card" content={ twitterCard } />
    <meta name="twitter:title" content={ title } />
    <meta name="twitter:description" content={ description } />
    { ogImage && <meta name="twitter:image" content={ ogImage } /> }
    { children }
  </Head>
);
