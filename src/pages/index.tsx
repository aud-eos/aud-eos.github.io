import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import ReactMarkdown from "react-markdown";

import { getBlogPosts } from "@/utils";
import { TypeBlogPost } from "@/types";


const inter = Inter({ subsets: ["latin"] });


export interface HomeProps {
  posts: TypeBlogPost[];
}

export default function Home({ posts }: HomeProps ){
  console.log( "home component props:", { posts });
  return(
    <>
      <Head>
        <title>Audeos.com</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={ styles.main }>
        <div className={ styles.description }>
          <p>
            Welcome to &nbsp;
            <code className={ styles.code }>Audeos.com</code>
          </p>
          <div>Audeosdotcom</div>
        </div>

        <div className={ styles.center }>
          Audeos.com
          <div className={ styles.thirteen }>sup</div>
        </div>

        <ul>
          {
            posts.map( post => {
              console.log({ post });
              return(
                <div key={ post.fields.slug }>
                  <h4>{ post.fields.title }</h4>
                  <p>/post/{ post.fields.slug }</p>
                  <ReactMarkdown>{ post.fields.body || "" }</ReactMarkdown>
                </div>
              );
            })
          }
        </ul>

        <div className={ styles.grid }>
          <a href="" className={ styles.card } rel="noopener noreferrer">
            <h2 className={ inter.className }>
              Foo <span>-&gt;</span>
            </h2>
            <p className={ inter.className }>Bar.</p>
          </a>

          <a href="" className={ styles.card } rel="noopener noreferrer">
            <h2 className={ inter.className }>
              Foo <span>-&gt;</span>
            </h2>
            <p className={ inter.className }>Bar</p>
          </a>

          <a href="" className={ styles.card } rel="noopener noreferrer">
            <h2 className={ inter.className }>
              Foo <span>-&gt;</span>
            </h2>
            <p className={ inter.className }>Bar.</p>
          </a>

          <a href="" className={ styles.card } rel="noopener noreferrer">
            <h2 className={ inter.className }>
              Foo <span>-&gt;</span>
            </h2>
            <p className={ inter.className }>Bar</p>
          </a>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps(){
  const posts = await getBlogPosts();
  return{
    props: {
      posts,
    },
  };
}
