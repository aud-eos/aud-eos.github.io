"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import styles from "@/styles/CookieConsent.module.scss";
import { VT323 } from "next/font/google";
import { COOKIE_CONSENT_KEY } from "@/constants";

const fontVT323 = VT323({
  weight: "400",
});

export function resetCookieConsent() {
  localStorage.removeItem( COOKIE_CONSENT_KEY );
  window.dispatchEvent( new Event( "cookie-consent-reset" ) );
}

export default function CookieConsent() {
  const isClient = useSyncExternalStore( () => () => {}, () => true, () => false );
  const [ hasConsented, setHasConsented ] = useState( false );

  const isVisible = isClient && !hasConsented && localStorage.getItem( COOKIE_CONSENT_KEY ) === null;

  useEffect( () => {
    const handler = () => setHasConsented( false );
    window.addEventListener( "cookie-consent-reset", handler );
    return () =>
      window.removeEventListener( "cookie-consent-reset", handler );
  }, [] );

  const accept = () => {
    localStorage.setItem( COOKIE_CONSENT_KEY, "accepted" );
    if( window.gtag ) {
      window.gtag( "consent", "update", {
        analytics_storage: "granted",
      });
    }
    window.dispatchEvent( new Event( "cookie-consent-granted" ) );
    setHasConsented( true );
  };

  const reject = () => {
    localStorage.setItem( COOKIE_CONSENT_KEY, "rejected" );
    if( window.gtag ) {
      window.gtag( "consent", "update", {
        analytics_storage: "denied",
      });
    }
    setHasConsented( true );
  };

  /* keyboard shortcuts */
  useEffect( () => {
    if( !isVisible ) return;

    const handler = ( event: KeyboardEvent ) => {
      if( event.key === "y" || event.key === "Enter" ) accept();
      if( event.key === "n" || event.key === "Escape" ) reject();
    };

    window.addEventListener( "keydown", handler );
    return () => window.removeEventListener( "keydown", handler );
  }, [ isVisible ] );

  if( !isVisible ) return null;

  return (
    <div className={ `${styles.cookieModal} ${fontVT323.className}` }>
      <div className={ styles.cookieBox }>

        <div className={ styles.titleBar }>
          <span className={ styles.title }>Cookie Preferences</span>
          <div className={ styles.closeButton } onClick={ reject }>X</div>
        </div>

        <p className={ `${styles.message} ${styles.cursor}` }>
          This site uses analytics cookies.
        </p>

        <div className={ styles.buttons }>
          <button className={ styles.button } onClick={ accept }>
            [ Y ] Accept
          </button>
          <button className={ styles.button } onClick={ reject }>
            [ N ] Reject
          </button>
        </div>

      </div>
    </div>
  );
}
