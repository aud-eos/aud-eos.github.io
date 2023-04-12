import Link from "next/link";
import { FC } from "react";

import styles from "@/styles/Layout.module.scss";

export const TopNav: FC = () => {
  return (
    <nav className={ styles.topnav }>
      <Link href="/" scroll={ false }>Audeos.com</Link>
    </nav>
  );
};
