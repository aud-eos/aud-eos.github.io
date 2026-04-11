-include .env

install:
	@yarn

build:
	@yarn build

dev:
	@yarn dev

# Generate TS declarations for content types
# https://github.com/contentful-userland/cf-content-types-generator#usage
# https://www.seancdavis.com/posts/generating-workable-typescript-types-from-contentful-content/
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

lint:
	@yarn lint

format:
	@yarn format

# The caret (^) in a package.json file allows updates to minor and patch
# versions, while the tilde (~) restricts updates to only patch versions.
# Use caret for packages where you want new features and bug fixes, and tilde
# for maximum stability in critical systems.
upgrade:
	@yarn outdated
	@yarn upgrade --tilde

upgrade-latest:
	@yarn outdated
	@yarn upgrade --latest --tilde
	@yarn outdated

check:
	@yarn check

typecheck:
	@yarn typecheck
