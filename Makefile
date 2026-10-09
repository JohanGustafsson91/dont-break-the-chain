NPM=pnpm

.PHONY: dev build lint preview deploy test test-watch

dev:
	$(NPM) run dev

build:
	$(NPM) run build

lint:
	$(NPM) run lint

preview:
	$(NPM) run preview

# Deploys to the dev project; production is deployed by CI on merge to main.
deploy: lint
	$(NPM) run deploy

test:
	$(NPM) run test

test-watch:
	$(NPM) run test:watch
