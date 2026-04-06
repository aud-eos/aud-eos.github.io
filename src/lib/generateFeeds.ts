import fs from "fs";
import path from "path";
import { BlogPost } from "@/utils/contentfulUtils";
import { META_DESCRIPTION, META_TITLE, SITE_URL } from "@/constants";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";

interface BlogPostItemForFeeds {
  title: string
  slug: string
  description: string
  body: string
  date: string
  url: string
  image?: string
  rssImage?: string
}

function escapeXml( str: string ) {
  return str
    .replace( /&/g, "&amp;" )
    .replace( /</g, "&lt;" )
    .replace( />/g, "&gt;" )
    .replace( /"/g, "&quot;" )
    .replace( /'/g, "&apos;" );
}

export function generateFeeds( posts: BlogPost[] ) {
  /**
   * Create blog post items
   */
  const items: BlogPostItemForFeeds[] = posts
    .filter( post => !!post.fields.date )
    .sort( sortBlogPostsByDate )
    .map( post => {
      const rawImage = post.fields.image?.fields.file?.url
        ? `https:${post.fields.image.fields.file.url}`
        : undefined;
      return ({
        title: escapeXml( post.fields.title ),
        slug: escapeXml( post.fields.slug ),
        description: escapeXml( post.fields.description ?? "" ),
        body: escapeXml( post.fields.body ?? "" ),
        date: escapeXml( new Date( post.fields.date! ).toISOString() ),
        url: escapeXml( `${SITE_URL}/post/${post.fields.slug}` ),
        image: escapeXml( rawImage ?? "" ),
        rssImage: rawImage
          ? escapeXml( `${rawImage}?w=1200&fit=thumb&fm=jpg&q=75` )
          : undefined,
      });
    });

  /**
   * Adding lastBuildDate. Many RSS readers use it to decide when to refresh
   * feeds, and it’s part of the RSS 2.0 spec.
   */
  const lastBuildDate = items.length
    ? new Date( Math.max( ...items.map( item => new Date( item.date ).getTime() ) ) ).toUTCString()
    : new Date().toUTCString();

  /**
   * Generate RSS Section string
   */
  const rssItems: string = items.map( item => `
<item>
<title>${item.title}</title>
<link>${item.url}</link>
<guid isPermaLink="true">${item.url}</guid>
<pubDate>${new Date( item.date ).toUTCString()}</pubDate>
<description><![CDATA[${ item.rssImage
    ? `<img src="${item.rssImage}" />`
    : "" }${item.description}]]></description>
${item.rssImage ? `<media:content url="${item.rssImage}" medium="image"/>` : ""}
<content:encoded><![CDATA[${item.body}]]></content:encoded>
</item>` ).join( "" );

  const rssFeed: string = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
 xmlns:content="http://purl.org/rss/1.0/modules/content/"
 xmlns:media="http://search.yahoo.com/mrss/"
 xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${META_TITLE}</title>
<link>${SITE_URL}</link>
<description>${META_DESCRIPTION}</description>
<language>en-us</language>
<lastBuildDate>${lastBuildDate}</lastBuildDate>
<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${rssItems}
</channel>
</rss>`;

  /**
   * Generate Atom Items
   */
  const atomItems: string = items.map( item => `
<entry>
<title>${item.title}</title>
<link href="${item.url}"/>
<id>${item.url}</id>
<updated>${new Date( lastBuildDate ).toISOString()}</updated>
</entry>` ).join( "" );

  const atomFeed: string = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>${META_TITLE}</title>
<link href="${SITE_URL}"/>
<updated>${new Date().toISOString()}</updated>
${atomItems}
</feed>`;


  /**
   * Generate JSON Feed
   */
  const jsonItems = {
    version: "https://jsonfeed.org/version/1",
    title: META_TITLE,
    home_page_url: SITE_URL,
    feed_url: `${SITE_URL}/feed.json`,
    items: items.map( item => ({
      id: item.url,
      url: item.url,
      title: item.title,
      content_html: item.body,
      date_published: item.date,
      image: item.image,
    }) ),
  };

  const jsonFeed: string = JSON.stringify( jsonItems, null, 2 );

  /**
   * Write files to disk
   * Since generateFeeds() writes files into /public, it's safest to ensure the
   * directory exists before writing (mkDirSync)
   */
  const publicDir = path.join( process.cwd(), "public" );
  fs.mkdirSync( publicDir, { recursive: true });
  fs.writeFileSync( path.join( publicDir, "rss.xml" ), rssFeed );
  fs.writeFileSync( path.join( publicDir, "atom.xml" ), atomFeed );
  fs.writeFileSync( path.join( publicDir, "feed.json" ), jsonFeed );
}
