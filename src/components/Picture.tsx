import { CONTENT_IMAGE_WIDTH } from "@/constants";

export interface PictureProps {
  url: string;
  alt: string;
  maxWidth?: number;
  breakpoints?: number[],
  priority?: boolean;
}

export default function Picture({
  url,
  maxWidth = CONTENT_IMAGE_WIDTH,
  alt,
  breakpoints = [ 749, 600, 350 ],
  priority = false,
}: PictureProps ) {
  return (
    <picture>
      {
        breakpoints
          .filter( breakpoint => breakpoint < maxWidth )
          .map( breakpoint =>
            <source
              key={ breakpoint }
              media={ `(max-width: ${ breakpoint }px)` }
              srcSet={ getImgSrc( url, { width: breakpoint, format: "webp" }) }
              type={ "image/webp" }
            />,
          )
      }
      <source
        srcSet={ getImgSrc( url, { width: maxWidth, format: "webp" }) }
        type="image/webp"
      />
      <img
        src={ getImgSrc( url, { width: maxWidth }) }
        alt={ alt }
        loading={ priority ? "eager" : "lazy" }
        { ...( priority ? { fetchPriority: "high" } : {}) }
      />
    </picture>
  );
}


export interface ImageSourceOptions {
  format?: "jpg"|"png"|"webp"|"gif"|"avif";
  width?: number;
}

/**
 * Return URL for image source
 * @param src
 * @param options
 * @returns string
 */
const getImgSrc = ( src: string, {
  format,
  width,
}: ImageSourceOptions ): string => {
  const imageUrl = new URL( `https:${src}` );

  // Set "quality"
  imageUrl.searchParams.set( "q", "80" );

  // Set "format"
  if( format ) {
    imageUrl.searchParams.set( "fm", format );
  }

  // Progressive JPEGs
  // https://www.contentful.com/developers/docs/references/images-api/#/reference/changing-formats/progressive-jpegs/retrieve-an-image/console/curl
  if( format === "jpg" ) {
    imageUrl.searchParams.set( "fl", "progressive" );
  }

  if( width ) {
    imageUrl.searchParams.set( "w", width.toString() );
  }

  return imageUrl.toString();
};
