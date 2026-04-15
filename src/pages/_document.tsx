import { Html, Head, Main, NextScript } from "next/document";
import { THEME_PREFERENCE_KEY } from "@/constants";

const themeScript = `(function(){var p=localStorage.getItem("${THEME_PREFERENCE_KEY}");if(p==="light"||p==="dark"){document.documentElement.setAttribute("data-theme",p)}})()`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
        <script dangerouslySetInnerHTML={ { __html: themeScript } } />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
