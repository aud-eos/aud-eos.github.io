import { FC } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import styles from "@/styles/Markdown.module.scss";
import type { Element } from "hast";
import { MediaFigure } from "./MediaFigure";

function isElement( node: unknown ): node is Element {
  return typeof node === "object" && node !== null && "tagName" in node;
}

function stringProp( value: unknown ): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const markdownComponents: Components = {
  p: ({ node, children }) => {
    const firstChild = node?.children?.[0];

    if(
      node?.children?.length === 1 &&
      isElement( firstChild ) &&
      firstChild.tagName === "img"
    ) {
      const src = stringProp( firstChild.properties?.src );
      const alt = stringProp( firstChild.properties?.alt );

      if( src ) {
        return <MediaFigure src={ src } alt={ alt } />;
      }
    }

    return <p>{ children }</p>;
  },
};

interface MarkdownProps {
  children?: string
}

export const Markdown: FC<MarkdownProps> = ({ children }) => {
  return (
    <div className={ styles.reactMarkdown }>
      <ReactMarkdown components={ markdownComponents }>
        { children || "" }
      </ReactMarkdown>
    </div>
  );
};
