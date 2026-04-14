import styles from "@/styles/OldSchoolButton.module.scss";
import { Url } from "next/dist/shared/lib/router/router";
import Link from "next/link";
import { FC } from "react";
import { fontVT323 } from "@/styles/fonts";

interface OldSchoolButtonProps {
  label: string
  href?: Url
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  className?: string
}


export const OldSchoolButton: FC<OldSchoolButtonProps> = ({
  href,
  label,
  onClick,
  className = "",
}) => {

  const combinedClassName = `${styles.button} ${fontVT323.className} ${className}`.trim();

  if( href ) {
    return (
      <Link
        className={ combinedClassName }
        href={ href }
      >
        { label }
      </Link>
    );
  }

  return (
    <button
      className={ combinedClassName }
      onClick={ onClick }
    >
      { label }
    </button>
  );
};
