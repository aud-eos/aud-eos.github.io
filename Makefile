-include .env

build:
	@yarn build

dev:
	@yarn dev

# Generate TS declarations for content types
# https://github.com/contentful-userland/cf-content-types-generator#usage
generate-types:
	@yarn cf-content-types-generator \
		-s $(CONTENTFUL_SPACE_ID) \
		-t $(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN) \
		-d \
		-o types
