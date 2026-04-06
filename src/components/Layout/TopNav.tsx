import Link from "next/link";
import { useRouter } from "next/router";
import { FC, FormEvent, useState } from "react";

import styles from "@/styles/Layout.module.scss";

export const TopNav: FC = () => {
  const router = useRouter();
  const initialQuery = typeof router.query.q === "string" ? router.query.q : "";
  const [ query, setQuery ] = useState( initialQuery );

  const handleSubmit = ( e: FormEvent ) => {
    e.preventDefault();
    if( query.trim() ) {
      router.push( `/search?q=${encodeURIComponent( query.trim() )}` );
    }
  };

  return (
    <nav className={ styles.topnav }>
      <Link href="/" scroll={ false }>Audeos.com</Link>
      <form onSubmit={ handleSubmit } className={ styles.searchForm } role="search">
        <input
          type="search"
          name="q"
          value={ query }
          onChange={ e => setQuery( e.target.value ) }
          placeholder="Search posts…"
          aria-label="Search posts"
          className={ styles.searchInput }
        />
      </form>
    </nav>
  );
};
