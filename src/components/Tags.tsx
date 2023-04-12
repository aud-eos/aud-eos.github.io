import { TagLink } from "contentful";
import { FC } from "react";

import styles from "@/styles/Tags.module.scss";


export interface TagProps {
  tagName: string;
}

const Tag: FC<TagProps> = ({ tagName }) => {
  return (
    <code>#{ tagName }</code>
  );
};


export interface TagsProps {
  tags: TagLink[];
}

export const Tags: FC<TagsProps> = ({ tags }) => {
  return (
    <section className={ styles.tags }>
      {
        tags
          .map(
            tag =>
              <Tag
                key={ tag.sys.id }
                tagName={ tag.sys.id }
                />
                )
      }
    </section>
  );
};
