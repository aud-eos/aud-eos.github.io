import { FC } from "react";
import ReactMarkdown from "react-markdown";
import styles from "@/styles/Markdown.module.scss";
import Picture from "@/components/Picture";


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


const markdownComponents: object = {
  p: ( paragraph: { children?: boolean; node?: any }) => {
    const { node } = paragraph;

    if( node.children[0].tagName === "img" ){

      const image = node.children[0];
      const { src, alt } = image.properties;
      const extension = src?.split( "." ).pop()?.toLowerCase();
      const isVideo = VIDEO_FILE_FORMAT_EXTENSIONS.includes( extension );

      if( isVideo ){
        return (
          <>
            <video controls preload="metadata">
              <source
                src={ `${src}#t=0.001` }
                type={ `video/${extension}` }
                />
            </video>
            <p>
              { alt }
            </p>
          </>
        );
      }

      return (
        <figure>
          <Picture
            url={ src }
            alt={ alt }
            />
          <figcaption>
            { alt }
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
    <ReactMarkdown className={ styles.reactMarkdown }
      components={ markdownComponents }
    >{ children || "" }</ReactMarkdown>
  );
};


