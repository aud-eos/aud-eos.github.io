import { TagLink } from "contentful";
import { FC } from "react";

import styles from "@/styles/Tags.module.scss";
import Link from "next/link";


export interface TagProps {
  tagName: string;
  isTagged?: boolean;
}

const Tag: FC<TagProps> = ({ tagName, isTagged }) => {
  const className = isTagged ? styles.isTagged : undefined;
  const href = isTagged ? "/" : `/tags/${tagName}`;
  return (
    <Link href={ href }>
      <code className={ className }>#{ tagName }</code>
    </Link>
  );
};


export interface TagsProps {
  tags: TagLink[];
  tagId?: string;
}

export const Tags: FC<TagsProps> = ({ tags, tagId }) => {
  return (
    <section className={ styles.tags }>
      {
        tags
          .map(
            tag =>
              <Tag
                key={ tag.sys.id }
                tagName={ tag.sys.id }
                isTagged={ tagId == tag.sys.id }
                />
                )
      }
    </section>
  );
};
