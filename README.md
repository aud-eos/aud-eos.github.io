# Audeos.com

This site is automatically deployed to **GitHub Pages** using GitHub Actions.

[![Deploy](https://github.com/aud-eos/aud-eos.github.io/actions/workflows/nextjs.yml/badge.svg)](https://github.com/aud-eos/aud-eos.github.io/actions/workflows/nextjs.yml)
[![Tests](https://github.com/aud-eos/aud-eos.github.io/actions/workflows/pr-build-stats.yml/badge.svg?label=tests)](https://github.com/aud-eos/aud-eos.github.io/actions/workflows/pr-build-stats.yml)
[![Socket Security](https://github.com/aud-eos/aud-eos.github.io/actions/workflows/socket.yml/badge.svg)](https://github.com/aud-eos/aud-eos.github.io/actions/workflows/socket.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fwww.audeos.com)](https://www.audeos.com)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-v25.8.1-339933?logo=node.js&logoColor=white)
![Yarn](https://img.shields.io/badge/Yarn-4-2C8EBB?logo=yarn&logoColor=white)
![Tested with Vitest](https://img.shields.io/badge/tested%20with-vitest-6E9F18?logo=vitest&logoColor=white)

![Last Commit](https://img.shields.io/github/last-commit/aud-eos/aud-eos.github.io/main)
![Repo Size](https://img.shields.io/github/repo-size/aud-eos/aud-eos.github.io)

## Getting Started

### Prerequisites

- **Node.js ≥25.8.1** (see `.nvmrc`)
- **Corepack** — manages the project's pinned Yarn 4 version via the `packageManager` field in `package.json`

On macOS, Homebrew's Node formula excludes Corepack, so install it separately:

```bash
brew install corepack   # removes Homebrew yarn/pnpm if installed (Corepack provides shims)
corepack enable
```

On other platforms, Corepack ships with Node ≥16.10 and only needs to be enabled:

```bash
corepack enable
```

### Install and run

```bash
yarn install      # Corepack auto-downloads Yarn 4.x on first invocation
yarn dev          # Start the development server
yarn build        # Build the static export to ./dist
yarn test         # Run the Vitest suite
yarn lint         # ESLint + TypeScript typecheck
```

For dependency upgrades and Contentful tooling, see the targets in `Makefile` (`make upgrade`, `make types`, `make upload-images`).

### .env

```bash
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""

CONTENTFUL_SPACE_ID=""
CONTENTFUL_ACCESS_TOKEN=""
CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN=""
CONTENTFUL_ENVIRONMENT="master"
```
