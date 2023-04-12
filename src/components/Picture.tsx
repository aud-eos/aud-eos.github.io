
export interface PictureProps {
  url: string;
  alt: string;
  maxWidth?: number;
  maxHeight?: number;
  breakpoints?: number[],
}

export default function Picture({
  url,
  maxWidth = 750,
  maxHeight,
  alt,
  breakpoints = [ 749, 600, 350 ],
}: PictureProps ){
  return (
    <picture>
      {
        breakpoints
          // @TODO: I hate this.
          .map( breakpoint => shouldRenderSourceSet( breakpoint, maxWidth, maxHeight ) ?
            <source key={ breakpoint }
              media={ `(max-width: ${ breakpoint }px)` }
              srcSet={ getImgSrc( url, { width: breakpoint, format: "webp" }) }
              type={ "image/webp" }
            /> : null
            )
      }
      <source
        srcSet={ getImgSrc( url, { width: maxWidth, height: maxHeight, format: "webp" }) }
        type="image/webp"
        />
      <img
        src={ getImgSrc( url, { width: maxWidth, height: maxHeight }) }
        alt={ alt }
      />
    </picture>
  );
}


export interface ImageSourceOptions {
  format?: "jpg"|"png"|"webp"|"gif"|"avif";
  width?: number;
  height?: number;
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
  height,
}: ImageSourceOptions ): string => {
  const imageUrl = new URL( `https:${src}` );

  // Set "quality"
  imageUrl.searchParams.set( "q", "100" );

  // Set "format"
  if( format ){
    imageUrl.searchParams.set( "fm", format );
  }

  // Progressive JPEGs
  // https://www.contentful.com/developers/docs/references/images-api/#/reference/changing-formats/progressive-jpegs/retrieve-an-image/console/curl
  if( format === "jpg" ){
    imageUrl.searchParams.set( "fl", "progressive" );
  }

  if( width ){
    imageUrl.searchParams.set( "w", width.toString() );
  }

  if( height ){
    imageUrl.searchParams.set( "h", height.toString() );
  }

  return imageUrl.toString();
};


const shouldRenderSourceSet = (
  breakpoint: number,
  maxWidth: number,
  maxHeight?: number,
  ): boolean => {
    const compareTo = ( maxHeight || maxWidth );
    return breakpoint < ( compareTo );
};
