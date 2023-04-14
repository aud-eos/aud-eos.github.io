import Script from "next/script";
import { useEffect, useState } from "react";



export function Comments(){

  const [ isHydrated, setIsHydrated ] = useState( false );
  useEffect( ()=> setIsHydrated( true ), [ setIsHydrated ] );

  if( !isHydrated ){
    return null;
  }

  /**
   * @TODO Commento is not being actively developed and breaks on page route
   * changes. https://www.talkyard.io/ seems good and works with Gatsby but
   * doesn't obviously yet work with next.js. So no comments for now.
   */
  if( isHydrated || true === true ){
    return null;
  }

  return (
    <>
      <Script defer src="https://cdn.commento.io/js/commento.js"></Script>
      <div id="commento"></div>
    </>
  );
}
