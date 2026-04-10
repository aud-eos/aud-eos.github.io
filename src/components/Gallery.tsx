import { FC, useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { Asset } from "contentful";
import styles from "@/styles/Gallery.module.scss";

export interface GalleryItem {
  url: string;
  description: string;
  title: string;
  type: "image" | "video";
}

interface GalleryProps {
  items: GalleryItem[];
}

const GALLERY_IMAGE_WIDTH = 1200;

function assetToGalleryItem(
  asset: Asset<"WITHOUT_UNRESOLVABLE_LINKS", string>,
): GalleryItem | null {
  const file = asset.fields.file;
  if( !file?.url ) return null;
  const mimeType = file.contentType || "";
  const isVideo = mimeType.startsWith( "video/" );
  const url = isVideo
    ? `https:${file.url}`
    : `https:${file.url}?w=${GALLERY_IMAGE_WIDTH}`;
  return {
    url,
    description: asset.fields.description || "",
    title: asset.fields.title || "",
    type: isVideo ? "video" : "image",
  };
}

export function resolveGalleryItems(
  assets: ( Asset<"WITHOUT_UNRESOLVABLE_LINKS", string> | undefined )[] | undefined,
): GalleryItem[] {
  if( !assets ) return [];
  return assets.flatMap( asset => {
    if( !asset ) return [];
    const item = assetToGalleryItem( asset );
    return item ? [ item ] : [];
  });
}

interface SlideProps {
  item: GalleryItem;
  isNearActive: boolean;
  isActive: boolean;
}

const Slide: FC<SlideProps> = ({ item, isNearActive, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>( null );

  useEffect( () => {
    if( !isActive ) videoRef.current?.pause();
  }, [ isActive ] );

  if( item.type === "video" ) {
    return (
      <video
        ref={ videoRef }
        className={ styles.video }
        src={ item.url }
        controls
        playsInline
        aria-label={ item.description || item.title }
      />
    );
  }
  return (
    <Image
      src={ item.url }
      alt={ item.description || item.title }
      fill
      sizes="(max-width: 768px) 100vw, 800px"
      loading={ isNearActive ? "eager" : "lazy" }
    />
  );
};

const Gallery: FC<GalleryProps> = ({ items }) => {
  const [ activeIndex, setActiveIndex ] = useState( 0 );

  const goToPrev = useCallback( () => {
    setActiveIndex( current => ( current - 1 + items.length ) % items.length );
  }, [ items.length ] );

  const goToNext = useCallback( () => {
    setActiveIndex( current => ( current + 1 ) % items.length );
  }, [ items.length ] );

  const handleKeyDown = useCallback( ( event: React.KeyboardEvent ) => {
    if( event.key === "ArrowLeft" ) goToPrev();
    if( event.key === "ArrowRight" ) goToNext();
  }, [ goToPrev, goToNext ] );

  if( items.length === 0 ) return null;

  if( items.length === 1 ) {
    const singleItem = items[0];
    return (
      <figure
        className={ styles.gallery }
        aria-label="Photo gallery"
      >
        <div className={ styles.viewport }>
          <div className={ styles.singleSlide }>
            <Slide item={ singleItem } isNearActive isActive />
          </div>
        </div>
        <figcaption className={ styles.captionArea }>
          { singleItem.description || singleItem.title }
        </figcaption>
      </figure>
    );
  }

  const activeItem = items[activeIndex];
  const announcement = activeItem.description || activeItem.title
    ? `${ activeItem.description || activeItem.title }, ${ activeIndex + 1 } of ${ items.length }`
    : `Slide ${ activeIndex + 1 } of ${ items.length }`;

  return (
    <figure
      className={ styles.gallery }
      aria-roledescription="carousel"
      aria-label="Photo gallery"
      onKeyDown={ handleKeyDown }
    >
      { /* Screen-reader live announcement — visually hidden */ }
      <p className={ styles.srOnly } aria-live="polite" aria-atomic="true">
        { announcement }
      </p>

      <div className={ styles.viewport }>
        <div
          className={ styles.track }
          style={ { transform: `translateX(-${ activeIndex * 100 }%)` } }
        >
          { items.map( ( item, index ) => (
            <div
              key={ index }
              className={ styles.slideItem }
              role="group"
              aria-roledescription="slide"
              aria-label={ `${ index + 1 } of ${ items.length }${ item.description ? `: ${ item.description }` : "" }` }
              aria-hidden={ index !== activeIndex }
            >
              <Slide item={ item } isNearActive={ Math.abs( index - activeIndex ) <= 1 } isActive={ index === activeIndex } />
            </div>
          ) ) }
        </div>
        <button className={ styles.navPrev } onClick={ goToPrev } aria-label="Previous image">
          ‹
        </button>
        <button className={ styles.navNext } onClick={ goToNext } aria-label="Next image">
          ›
        </button>
        <span className={ styles.counter } aria-hidden="true">
          { activeIndex + 1 } / { items.length }
        </span>
      </div>

      { /* Always rendered — min-height prevents layout shift when caption is empty */ }
      <figcaption className={ styles.captionArea }>
        { activeItem.description || activeItem.title }
      </figcaption>

      <div className={ styles.dots } aria-label="Gallery navigation" role="group">
        { items.map( ( item, dotIndex ) => (
          <button
            key={ dotIndex }
            className={ `${ styles.dot } ${ dotIndex === activeIndex ? styles.dotActive : "" }` }
            onClick={ () => setActiveIndex( dotIndex ) }
            aria-label={ `${ item.type === "video" ? "Video" : "Image" } ${ dotIndex + 1 }${ item.description ? `: ${ item.description }` : "" }` }
            aria-current={ dotIndex === activeIndex }
          />
        ) ) }
      </div>
    </figure>
  );
};

export default Gallery;
