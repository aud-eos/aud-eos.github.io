import { useCallback, useEffect, useSyncExternalStore, useState } from "react";
import styles from "@/styles/CookieConsent.module.scss";
import { COOKIE_CONSENT_KEY } from "@/constants";
import { fontVT323 } from "@/styles/fonts";

export function resetCookieConsent() {
  localStorage.removeItem( COOKIE_CONSENT_KEY );
  window.dispatchEvent( new Event( "cookie-consent-reset" ) );
}

export default function CookieConsent() {
  const isClient = useSyncExternalStore( () => () => {}, () => true, () => false );
  // null  = uninitialized (defer to localStorage)
  // true  = explicitly opened (e.g. after reset)
  // false = explicitly closed (after accept or reject)
  const [ isOpen, setIsOpen ] = useState<boolean | null>( null );

  const isVisible = isClient && (
    isOpen === true ||
    ( isOpen === null && localStorage.getItem( COOKIE_CONSENT_KEY ) === null )
  );

  useEffect( () => {
    const handler = () => setIsOpen( true );
    window.addEventListener( "cookie-consent-reset", handler );
    return () =>
      window.removeEventListener( "cookie-consent-reset", handler );
  }, [] );

  const accept = useCallback( () => {
    localStorage.setItem( COOKIE_CONSENT_KEY, "accepted" );
    if( window.gtag ) {
      window.gtag( "consent", "update", {
        analytics_storage: "granted",
      });
    }
    window.dispatchEvent( new Event( "cookie-consent-granted" ) );
    setIsOpen( false );
  }, [] );

  const reject = useCallback( () => {
    localStorage.setItem( COOKIE_CONSENT_KEY, "rejected" );
    if( window.gtag ) {
      window.gtag( "consent", "update", {
        analytics_storage: "denied",
      });
    }
    setIsOpen( false );
  }, [] );

  /* keyboard shortcuts */
  useEffect( () => {
    if( !isVisible ) return;

    const handler = ( event: KeyboardEvent ) => {
      if( event.key === "y" || event.key === "Enter" ) accept();
      if( event.key === "n" || event.key === "Escape" ) reject();
    };

    window.addEventListener( "keydown", handler );
    return () => window.removeEventListener( "keydown", handler );
  }, [ isVisible, accept, reject ] );

  if( !isVisible ) return null;

  return (
    <div className={ `${styles.cookieModal} ${fontVT323.className}` } onClick={ reject }>
      <div className={ styles.cookieBox } onClick={ event => event.stopPropagation() }>

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
