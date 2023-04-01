import { createClient } from 'contentful';


const CONTENTFUL_SPACE_ID: string = process.env["CONTENTFUL_SPACE_ID"] as string;
const CONTENTFUL_ACCESS_TOKEN: string = process.env["CONTENTFUL_ACCESS_TOKEN"] as string;


if( !CONTENTFUL_SPACE_ID || !CONTENTFUL_ACCESS_TOKEN ){
  throw new Error("Missing CONTENTFUL_SPACE_ID or CONTENTFUL_ACCESS_TOKEN");
}


const client = createClient({
  space: CONTENTFUL_SPACE_ID,
  accessToken: CONTENTFUL_ACCESS_TOKEN,
});


// Retrieve the list of blog posts from Contentful
const getBlogPosts = async () => {
  const response = await client.getEntries({
    content_type: 'blogPost',
  });

  return response.items;
};


export default getBlogPosts;
