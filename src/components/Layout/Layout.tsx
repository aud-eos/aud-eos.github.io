import { FC, ReactNode } from "react";
import styles from "@/styles/Layout.module.scss";


interface LayoutProps {
  children?: ReactNode
}


export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <div className={ styles.container }>
      <section className={ styles.wrapper }>
        { children }
      </section>
    </div>
  );
};
