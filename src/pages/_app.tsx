import { Mona_Sans } from "next/font/google";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import * as gtag from "../lib/google-analytics";
import { GoogleAnalyics } from "@/lib/GoogleAnalyics";


const fontMona_Sans = Mona_Sans({
  subsets:[ "latin" ],
});

export default function App({ Component, pageProps }: AppProps ) {

  const router = useRouter();

  /** Google Analytics Effect */
  useEffect( () => {
    const handleRouteChange = ( url: string ) => gtag.trackPageview( url );
    router.events.on( "routeChangeComplete", handleRouteChange );
    return () => router.events.off( "routeChangeComplete", handleRouteChange );
  }, [ router.events ] );

  return (
    <>
      <GoogleAnalyics />
      <div className={ fontMona_Sans.className }>
        <Component { ...pageProps } />
      </div>
    </>
  );
}
