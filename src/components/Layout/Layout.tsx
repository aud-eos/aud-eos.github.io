import { FC, ReactNode } from "react";
import styles from "@/styles/Layout.module.scss";
import { TopNav } from "@/components/Layout/TopNav";
import { Footer } from "@/components/Layout/Footer";


interface LayoutProps {
  children?: ReactNode
  isFullwidth?: boolean
}

export const Container: FC<{ children?: ReactNode }> = ({ children }) =>
  <div className={ styles.container }>{ children }</div>;

export const Wrapper: FC<{ children?: ReactNode }> = ({ children }) =>
  <section className={ styles.wrapper }>{ children }</section>;

/**
 * Layout component
 */
export const Layout: FC<LayoutProps> = ({
  children,
  isFullwidth,
}) => {
  return (
    <Container>
      <TopNav />
      {
        isFullwidth
          ? children
          : <Wrapper>{ children }</Wrapper>
      }
      <Footer />
    </Container>
  );
};
