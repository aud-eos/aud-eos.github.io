import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

import getBlogPosts from '@/utils';

const inter = Inter({ subsets: ['latin'] })

export interface BlogPost {
  fields: {
    title: string;
  },
  sys: {
    id: string;
  }
}

export interface HomeProps {
  posts: BlogPost[];
}

export default function Home({ posts }: HomeProps) {

  console.log({ posts });

  return (
    <>
      <Head>
        <title>Audeos.com</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.description}>
          <p>
            Welcome to &nbsp;
            <code className={styles.code}>Audeos.com</code>
          </p>
          <div>
            Audeosdotcom
          </div>
        </div>

        <div className={styles.center}>
          Audeos.com
          <div className={styles.thirteen}>
            sup
          </div>
        </div>

        <ul>
        {
          posts
            .map(
              post =>
                <div key={ post.sys.id }>
                  <h4>{ post.fields.title }</h4>
                  <p>
                    {/* { documentToHtmlString(post.fields.body) } */}
                  </p>
                </div>
            )
        }
        </ul>

        <div className={styles.grid}>
          <a
            href=""
            className={styles.card}
            rel="noopener noreferrer"
          >
            <h2 className={inter.className}>
              Foo <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              Bar.
            </p>
          </a>

          <a
            href=""
            className={styles.card}
            rel="noopener noreferrer"
          >
            <h2 className={inter.className}>
              Foo <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              Bar
            </p>
          </a>

          <a
            href=""
            className={styles.card}
            rel="noopener noreferrer"
          >
            <h2 className={inter.className}>
              Foo <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              Bar.
            </p>
          </a>

          <a
            href=""
            className={styles.card}
            rel="noopener noreferrer"
          >
            <h2 className={inter.className}>
              Foo <span>-&gt;</span>
            </h2>
            <p className={inter.className}>
              Bar
            </p>
          </a>
        </div>
      </main>
    </>
  )
}

export async function getStaticProps() {
  const posts = await getBlogPosts();
  return {
    props: {
      posts
    },
  }
}
