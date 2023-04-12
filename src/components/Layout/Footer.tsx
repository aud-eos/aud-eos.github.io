import Link from "next/link";
import { FC } from "react";

import styles from "@/styles/Layout.module.scss";

export const Footer: FC = () => {
  return (
    <footer className={ styles.footer }>
      © <Link href="/" scroll={ false } >Audeos.com</Link>
    </footer>
  );
};
