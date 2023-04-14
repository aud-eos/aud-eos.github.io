import { useEffect, useState } from "react";



export function Comments(){

  const [ isHydrated, setIsHydrated ] = useState( false );
  useEffect( ()=> setIsHydrated( true ), [ setIsHydrated ] );

  if( !isHydrated ){
    return null;
  }

  return (
    <>
      <script defer src="https://cdn.commento.io/js/commento.js"></script>
      <div id="commento"></div>
    </>
  );
}
