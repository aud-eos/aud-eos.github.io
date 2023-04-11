import { FC, ReactNode } from "react";
import styles from "@/styles/Layout.module.scss";


interface LayoutProps {
  children?: ReactNode
}

export const Container: FC<LayoutProps> = ({ children }) =>
  <div className={ styles.container }>{ children }</div>;

export const Wrapper: FC<LayoutProps> = ({ children }) =>
  <section className={ styles.wrapper }>{ children }</section>;

export const Layout: FC<LayoutProps> = ({ children }) =>
  <Container><Wrapper>{ children }</Wrapper></Container>;
