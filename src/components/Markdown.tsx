// Markdown.tsx
import Image from "next/image";
import { FC } from "react";
import ReactMarkdown from "react-markdown";
import styles from "@/styles/Markdown.module.scss";

const markdownComponents: object = {
  p: ( paragraph: { children?: boolean; node?: any }) => {
    const { node } = paragraph;
    if( node.children[0].tagName === "img" ){
      const image = node.children[0];
      const imageSource = `https:${image.properties.src}`;

        return (
          <figure className={ styles.markdown }>
            <picture>
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


