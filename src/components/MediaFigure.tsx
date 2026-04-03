import { FC } from "react";
import Picture from "./Picture";

export const VIDEO_FILE_FORMAT_EXTENSIONS = [
  "mp4",
  "mov",
  "wmv",
  "webm",
  "mkv",
  "ogg",
  "flv",
  "avi",
  "avchd",
];

interface MediaFigureProps {
  src: string;
  alt?: string;
}

export function getExtension( src: string | Blob | undefined ): string | undefined {
  if( typeof src !== "string" ) return undefined;
  try {
    const url = new URL( src, "https://dummy-base.local" );
    const pathname = url.pathname;
    return pathname.split( "." ).pop()?.toLowerCase();
  } catch {
    return undefined;
  }
}

export const MediaFigure: FC<MediaFigureProps> = ({ src, alt }) => {
  const extension = getExtension( src );

  if( extension && VIDEO_FILE_FORMAT_EXTENSIONS.includes( extension ) ) {
    return (
      <>
        <video controls preload="metadata">
          <source src={ `${src}#t=0.001` } type={ `video/${extension}` } />
        </video>
        { alt && <p>{ alt }</p> }
      </>
    );
  }

  return (
    <figure>
      <Picture url={ src } alt={ alt || "" } />
      { alt && <figcaption>{ alt }</figcaption> }
    </figure>
  );
};
