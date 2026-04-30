import Link from "next/link";
import { CATEGORY_IDS } from "@/constants";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../data/categories.json";
import styles from "@/styles/Home.module.scss";

export interface CategoryNavProps {
  currentCategory: string | null;
}

export default function CategoryNav({ currentCategory }: CategoryNavProps ) {
  const config: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  return (
    <nav className={ styles.categoryNav }>
      {
        CATEGORY_IDS.map( categoryId => {
          const isActive = categoryId === currentCategory;
          return (
            <Link
              key={ categoryId }
              href={ `/category/${categoryId}` }
              className={ isActive ? styles.categoryActive : styles.category }
            >
              { config[categoryId].title }
            </Link>
          );
        })
      }
    </nav>
  );
}
