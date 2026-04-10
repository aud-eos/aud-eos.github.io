import { TagLink } from "contentful";
import { FC } from "react";

import styles from "@/styles/Tags.module.scss";
import Link from "next/link";
import { POSTS_ANCHOR } from "@/constants";


export interface TagProps {
  tagName: string;
  isTagged?: boolean;
}

const TagComponent: FC<TagProps> = ({ tagName, isTagged }) => {
  const className = isTagged ? styles.isTagged : undefined;
  const href = isTagged ? `/#${POSTS_ANCHOR}` : `/tags/${tagName}#${POSTS_ANCHOR}`;
  return (
    <Link href={ href }>
      <code className={ className }>#{ tagName }</code>
    </Link>
  );
};


export interface TagsProps {
  tags: { sys: TagLink; }[];
  tagId?: string;
}

export const Tags: FC<TagsProps> = ({ tags, tagId }) => {
  return (
    <section className={ styles.tags }>
      {
        tags
          .map( tag =>
            <TagComponent
              key={ tag.sys.id }
              tagName={ tag.sys.id }
              isTagged={ tagId == tag.sys.id }
            /> )
      }
    </section>
  );
};
