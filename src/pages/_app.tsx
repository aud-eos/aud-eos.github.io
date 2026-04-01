import { Mona_Sans } from "next/font/google";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

const fontMona_Sans = Mona_Sans({
  subsets:[ "latin" ],
});

export default function App({ Component, pageProps }: AppProps ){
  return (
    <div className={ fontMona_Sans.className }>
      <Component { ...pageProps } />
    </div>
  );
}
