import { createClient } from 'contentful';


const {
  CONTENTFUL_SPACE_ID,
  CONTENTFUL_ACCESS_TOKEN,
} = process.env;


const client = createClient({
  space: CONTENTFUL_SPACE_ID || 'xxxxxxxx',
  accessToken: CONTENTFUL_ACCESS_TOKEN || 'xxxxxxxx',
});


// Retrieve the list of blog posts from Contentful
const getBlogPosts = async () => {
  const response = await client.getEntries({
    content_type: 'blogPost',
  });

  return response.items;
};


export default getBlogPosts;
