import { FC } from "react";
import ReactMarkdown from "react-markdown";
import styles from "@/styles/Markdown.module.scss";

interface ImageSourceSetOptions {
  format: "jpg"|"png"|"webp"|"gif"|"avif"
  width: number
}


/**
 * Return URL for image source
 * @param src
 * @param options
 * @returns string
 */
const getImgSrcSet = ( src: string, options: ImageSourceSetOptions ): string => {
  const imageUrl = new URL( `https:${src}` );
  imageUrl.searchParams.set( "fm", options.format );

  // Progressive JPEGs
  // https://www.contentful.com/developers/docs/references/images-api/#/reference/changing-formats/progressive-jpegs/retrieve-an-image/console/curl
  if( options.format === "jpg" ){
    imageUrl.searchParams.set( "fl", "progressive" );
  }

  imageUrl.searchParams.set( "w", options.width.toString() );
  return imageUrl.toString();
};


const SRCSETS: ImageSourceSetOptions[] = [
  { format: "webp", width: 750 },
  { format: "webp", width: 550 },
  { format: "webp", width: 450 },
  { format: "webp", width: 350 },
  { format: "webp", width: 250 },
  { format: "jpg", width: 750 },
  { format: "png", width: 750 },
];


const markdownComponents: object = {
  p: ( paragraph: { children?: boolean; node?: any }) => {
    const { node } = paragraph;

    if( node.children[0].tagName === "img" ){
      const image = node.children[0];
      const { src } = image.properties;
      const imageSource = getImgSrcSet( src, { format: "jpg", width: 750 });
      return (
        <figure className={ styles.markdown }>
          <picture>
            {
              SRCSETS.map( ( options, idx ) =>
                <source key={ `sourceset${idx}` }
                  media={ `(max-width: ${options.width}px)` }
                  srcSet={ getImgSrcSet( src, options ) }
                  type={ `image/${options.format}` }
                  /> )
            }
            <img
              src={ imageSource }
              alt={ image.properties.alt }
            />
          </picture>
          <figcaption>
            { image.properties.alt }
          </figcaption>
        </figure>
      );
    }
    return <p>{ paragraph.children }</p>;
  },
};

interface MarkdownProps {
  children?: string
}

export const Markdown: FC<MarkdownProps> = ({ children }) => {
  return (
    <ReactMarkdown
      components={ markdownComponents }
    >{ children || "" }</ReactMarkdown>
  );
};


