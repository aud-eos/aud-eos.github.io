import nextTypescript from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig( [ ...nextTypescript, ...nextVitals, {
  // Picture.tsx uses a native <picture>/<source> pattern to serve WebP via Contentful's
  // Images API, which is more effective than next/image here since static export requires
  // `images.unoptimized: true` (making next/image render a plain <img> with no optimization).
  files: [ "src/components/Picture.tsx", "src/__tests__/**/*.tsx" ],
  rules: {
    "@next/next/no-img-element": "off",
  },
}, {
  rules: {
    "indent": [ "error", 2 ],
    "array-bracket-spacing": [ 2, "always" ],
    "arrow-parens": [ 2, "as-needed" ],
    "comma-dangle": [ "error", "always-multiline" ],

    "keyword-spacing": [ 2, {
      after: true,

      overrides: {
        if: {
          after: false,
        },

        for: {
          after: false,
        },
      },
    } ],

    "no-multi-spaces": [ 2 ],
    "object-curly-spacing": [ 2, "always" ],

    quotes: [ 2, "double", {
      avoidEscape: true,
      allowTemplateLiterals: true,
    } ],

    "react/jsx-curly-spacing": [ 2, {
      when: "always",
      allowMultiline: true,
      children: true,

      spacing: {
        objectLiterals: "always",
      },
    } ],

    semi: [ 2, "always" ],

    "space-in-parens": [ 2, "always", {
      exceptions: [ "{}" ],
    } ],

    "space-before-blocks": [ 2, "always" ],
  },
}, // Override default ignores of eslint-config-next.
globalIgnores( [
  // Default ignores of eslint-config-next:
  ".next/**",
  "dist/**",
  "build/**",
  "next-env.d.ts",
] ), {
  ignores: [ "node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts" ],
} ],
);

export default eslintConfig;
