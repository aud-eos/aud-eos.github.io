import Link from "next/link";
import { useRouter } from "next/router";
import { FC, FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";

import styles from "@/styles/Layout.module.scss";
import { MAX_PREVIEW_RESULTS, SearchPost } from "@/lib/searchTypes";

export const TopNav: FC = () => {
  const router = useRouter();
  const initialQuery = typeof router.query.q === "string" ? router.query.q : "";
  const [ query, setQuery ] = useState( initialQuery );
  const [ searchIndex, setSearchIndex ] = useState<SearchPost[]>( [] );
  const [ showPreview, setShowPreview ] = useState( false );
  const indexLoaded = useRef( false );

  const fuse = useMemo(
    () =>
      new Fuse( searchIndex, {
        keys: [
          { name: "title", weight: 3 },
          { name: "description", weight: 2 },
          { name: "author", weight: 2 },
          { name: "spotifyText", weight: 1 },
          { name: "tags", weight: 1 },
          { name: "body", weight: 1 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [ searchIndex ],
  );

  const trimmedQuery = query.trim();
  const allResults = trimmedQuery.length >= 2
    ? fuse.search( trimmedQuery ).map( result => result.item )
    : [];
  const previewResults = allResults.slice( 0, MAX_PREVIEW_RESULTS );
  const hasMore = allResults.length > MAX_PREVIEW_RESULTS;

  const loadIndex = () => {
    if( indexLoaded.current ) return;
    indexLoaded.current = true;
    fetch( "/search-index.json" )
      .then( response => response.json() )
      .then( ( data: SearchPost[] ) => setSearchIndex( data ) )
      .catch( () => { indexLoaded.current = false; });
  };

  const handleSubmit = ( event: FormEvent ) => {
    event.preventDefault();
    setShowPreview( false );
    if( trimmedQuery ) {
      router.push( `/search?q=${encodeURIComponent( trimmedQuery )}` );
    }
  };

  const handleFocus = () => {
    loadIndex();
    setShowPreview( true );
  };

  const handleBlur = () => {
    setTimeout( () => setShowPreview( false ), 150 );
  };

  const handleKeyDown = ( event: KeyboardEvent ) => {
    if( event.key === "Escape" ) setShowPreview( false );
  };

  const closePreview = () => {
    setShowPreview( false );
    setQuery( "" );
  };

  return (
    <nav className={ styles.topnav }>
      <Link href="/" scroll={ false }>Audeos.com</Link>
      <div className={ styles.searchWrapper }>
        <form onSubmit={ handleSubmit } className={ styles.searchForm } role="search">
          <input
            type="search"
            name="q"
            value={ query }
            onChange={ event => setQuery( event.target.value ) }
            onFocus={ handleFocus }
            onBlur={ handleBlur }
            onKeyDown={ handleKeyDown }
            placeholder="Search posts…"
            aria-label="Search posts"
            className={ styles.searchInput }
            autoComplete="off"
          />
        </form>
        { showPreview && previewResults.length > 0 && (
          <ul className={ styles.searchPreview }>
            { previewResults.map( post => (
              <li key={ post.slug }>
                <Link href={ `/post/${post.slug}` } onClick={ closePreview }>
                  <span className={ styles.previewTitle }>{ post.title }</span>
                  { post.description && (
                    <span className={ styles.previewDescription }>{ post.description }</span>
                  ) }
                </Link>
              </li>
            ) ) }
            { hasMore && (
              <li className={ styles.previewMore }>
                <Link
                  href={ `/search?q=${encodeURIComponent( trimmedQuery )}` }
                  onClick={ () => setShowPreview( false ) }
                >
                  View all { allResults.length } results
                </Link>
              </li>
            ) }
          </ul>
        ) }
      </div>
    </nav>
  );
};
