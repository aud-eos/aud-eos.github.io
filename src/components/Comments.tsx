import Script from "next/script";
import { useEffect, useState } from "react";



export function Comments(){

  const [ isHydrated, setIsHydrated ] = useState( false );
  useEffect( ()=> setIsHydrated( true ), [ setIsHydrated ] );

  if( !isHydrated ){
    return null;
  }

  return (
    <>
      <Script defer src="https://cdn.commento.io/js/commento.js"></Script>
      <div id="commento"></div>
    </>
  );
}
