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

deploy:
	$(NPM) run test && $(NPM) run build && firebase deploy

test:
	$(NPM) run test

test-watch:
	$(NPM) run test:watch
