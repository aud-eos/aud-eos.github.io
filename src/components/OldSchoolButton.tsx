import styles from "@/styles/OldSchoolButton.module.scss";
import { Url } from "next/dist/shared/lib/router/router";
import { VT323 } from "next/font/google";
import Link from "next/link";
import { FC } from "react";

const fontVT323 = VT323({
  weight: "400",
});

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
  className,
}) => {

  const _className = `${styles.button} ${fontVT323.className} ${className}`;

  if( !!href ) {
    return (
      <Link className={ _className }
        href={ href }
      >
        { label }
      </Link>
    );
  }

  if( !!onClick ) {
    return (
      <button className={ _className }
        onClick={ onClick }
      >
        { label }
      </button>
    );
  }
};
