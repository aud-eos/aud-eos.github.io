import { FC, ReactNode } from "react";
import styles from "@/styles/Layout.module.scss";
import { TopNav } from "@/components/Layout/TopNav";
import { Footer } from "@/components/Layout/Footer";


interface LayoutProps {
  children?: ReactNode
}

export const Container: FC<LayoutProps> = ({ children }) =>
  <div className={ styles.container }>{ children }</div>;

export const Wrapper: FC<LayoutProps> = ({ children }) =>
  <section className={ styles.wrapper }>{ children }</section>;

/**
 * Layout component
 */
export const Layout: FC<LayoutProps> = ({ children }) => {
  return (
    <Container>
      <TopNav />
      <Wrapper>
        { children }
      </Wrapper>
      <Footer />
    </Container>
  );
};
