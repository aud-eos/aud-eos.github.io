-include .env

# Install dependencies
install:
	@yarn

# Build for production — postbuild hook runs next-sitemap automatically
build:
	@yarn build

# Start the Next.js development server with hot reload
dev:
	@yarn dev

# Generate TypeScript declarations from Contentful content models.
# Two-step process:
#   1. Export the full Contentful space to contentful/export.json (gitignored)
#   2. Run cf-content-types-generator to produce typed interfaces, JSDoc,
#      type guards (-g), and response variants (-r) in src/types/contentful/
# Always use this target — never run cf-content-types-generator directly,
# as it skips the export step and produces a stripped-down format.
# https://github.com/contentful-userland/cf-content-types-generator#usage
types:
	@yarn contentful space export \
		--config contentful/export-config.json \
		--management-token $(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN) \
		--space-id $(CONTENTFUL_SPACE_ID)
	@yarn cf-content-types-generator \
		contentful/export.json \
		-s $(CONTENTFUL_SPACE_ID) \
		-t $(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN) \
		-d \
		-g \
		-r \
		-o src/types/contentful
	$(MAKE) format

# Upload media (images or videos) from a local directory or single file to Contentful.
# Supported: .jpg, .jpeg, .png, .gif, .webp, .mov, .mp4, .webm
# Outputs a JSON array of { filename, assetId, url } to stdout.
# Usage:
#   make upload-images DIR="/path/to/images"
#   make upload-images DIR="/path/to/single-image.jpg"
#   make upload-images DIR="/path/to/video.mov"
upload-images:
	@export CONTENTFUL_SPACE_ID=$(CONTENTFUL_SPACE_ID) \
		CONTENTFUL_ENVIRONMENT=$(CONTENTFUL_ENVIRONMENT) \
		CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN=$(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN); \
		node scripts/upload-images.mjs "$(DIR)"

# Run ESLint + TypeScript typecheck
lint:
	@yarn lint

# Run ESLint with auto-fix
format:
	@yarn format

# Upgrade dependencies interactively. Yarn 4's upgrade-interactive replaces
# the old `yarn outdated` + `yarn upgrade` pair from yarn 1, showing a table
# of available updates and letting you pick which to apply.
upgrade:
	@yarn upgrade-interactive

# Upgrade all dependencies to their absolute latest versions, ignoring semver
# ranges in package.json entirely. Use when intentionally adopting major
# version bumps.
upgrade-latest:
	@yarn up '*' --recursive

# TypeScript-only type check (no ESLint)
typecheck:
	@yarn typecheck

# `make tofu-init` — initialize OpenTofu in infra/. Run once after cloning,
# or whenever backend/provider config changes. Sources infra/.env first
# (gitignored; copy from infra/.env.example and fill in values).
tofu-init:
	@cd infra && set -a && . ./.env && set +a && tofu init

# `make tofu-plan` — show pending OpenTofu changes against AWS. Sources
# infra/.env. Read-only; does not modify infrastructure. Pass extra flags
# via ARGS, e.g. `make tofu-plan ARGS="-target=aws_route53_zone.audeos_com"`.
tofu-plan:
	@cd infra && set -a && . ./.env && set +a && tofu plan $(ARGS)

# `make tofu-apply` — apply pending OpenTofu changes. Interactive — prompts
# for "yes" before making changes. Never pass -auto-approve here; apply
# against shared cloud infra needs human-in-loop confirmation. Pass extra
# flags via ARGS, e.g. `make tofu-apply ARGS="-target=aws_route53_zone.audeos_com"`.
tofu-apply:
	@cd infra && set -a && . ./.env && set +a && tofu apply $(ARGS)

# `make tofu-fmt` — auto-format infra/*.tf files. Run before commit.
tofu-fmt:
	@cd infra && tofu fmt -recursive

# `make tofu-validate` — syntax + provider-arg check. No network calls,
# no state lookups. Quick sanity check before tofu-plan.
tofu-validate:
	@cd infra && tofu validate

# `make tofu-providers-lock` — populate `.terraform.lock.hcl` with `h1:`
# hashes for every platform we run tofu on (local M-series macOS + the
# linux_amd64 GH Actions runners + linux_arm64 for any future ARM runners
# or Fly machines). Run after bumping a provider version.
tofu-providers-lock:
	@cd infra && set -a && . ./.env && set +a && \
		tofu providers lock \
			-platform=darwin_arm64 \
			-platform=linux_amd64 \
			-platform=linux_arm64
