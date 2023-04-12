import { FC } from "react";
import ReactMarkdown from "react-markdown";
import styles from "@/styles/Markdown.module.scss";
import Picture from "@/components/Picture";


const markdownComponents: object = {
  p: ( paragraph: { children?: boolean; node?: any }) => {
    const { node } = paragraph;

    if( node.children[0].tagName === "img" ){
      const image = node.children[0];
      const { src } = image.properties;
      return (
        <figure>
          <Picture
            url={ src }
            alt={ image.properties.alt }
            />
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
    <ReactMarkdown className={ styles.reactMarkdown }
      components={ markdownComponents }
    >{ children || "" }</ReactMarkdown>
  );
};


