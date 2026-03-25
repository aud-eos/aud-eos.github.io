-include .env

install:
	@yarn

build:
	@yarn build

dev:
	@yarn dev

# Generate TS declarations for content types
# https://github.com/contentful-userland/cf-content-types-generator#usage
types:
	@yarn cf-content-types-generator \
		-s $(CONTENTFUL_SPACE_ID) \
		-t $(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN) \
		-d \
		-o src/types

lint:
	@yarn lint

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
