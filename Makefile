.PHONY: all
all: .build/front

.PHONY: install
install: .build/install

.PHONY: tests
tests: .build/tests

.PHONY: beautify
beautify: .build/beautify

.PHONY: lint
lint: .build/lint

.PHONY: coverage
coverage: coverage/lcov.info

.PHONY: report
report: coverage/lcov-report/index.html
	open $<

.PHONY: install-git-hook
install-git-hook:
	rm -f .git/hooks/pre-commit
	ln -s ../../git-precommit-hook.sh .git/hooks/pre-commit

.PHONY: check-coverage
check-coverage: .build/check-coverage

.PHONY: clean
clean:
	rm -rf .build node_modules static/widget/js/main.js

.build/build: Makefile
	mkdir -p .build && touch $@

ifeq ($(ENV),production)
  NPM_INSTALL_CMD=npm install --production
else
  NPM_INSTALL_CMD=npm install
endif

.build/install: .build/build package.json
	$(NPM_INSTALL_CMD) && touch $@

.build/install-dev: .build/build package.json
	npm install && touch $@

TEST_PATH="tests"
TEST_FILES=$(shell test -d $(TEST_PATH) && find $(TEST_PATH) -type f -name "*.js")

SOURCE_PATH="src"
SOURCE_FILES=$(shell test -d $(SOURCE_PATH) && find $(SOURCE_PATH) -type f -name "*.js")

MOCHA=node_modules/.bin/_mocha

$(MOCHA): .build/install-dev

.build/tests: .build/build $(MOCHA) $(TEST_FILES) $(SOURCE_FILES)
	test "$(TEST_FILES)" = "" || $(MOCHA) $(TEST_FILES)
	touch $@

JSBEAUTIFY=node_modules/.bin/js-beautify

$(JSBEAUTIFY): .build/install-dev

.build/beautify: .build/build $(JSBEAUTIFY) $(TEST_FILES) $(SOURCE_FILES)
	$(eval FILES := $(filter-out .build/build $(JSBEAUTIFY), $?))
	test "$(FILES)" = "" || $(JSBEAUTIFY) -r $(FILES)
	touch $@

ESLINT=node_modules/.bin/eslint

$(ESLINT): .build/install-dev

.build/lint: .build/build $(ESLINT) $(TEST_FILES) $(SOURCE_FILES)
	$(eval FILES := $(filter-out .build/build, $(filter-out $(ESLINT), $?)))
	test "$(FILES)" = "" || $(ESLINT) $(FILES)
	touch $@

ISTANBUL=node_modules/.bin/istanbul

$(ISTANBUL): .build/install-dev

coverage/lcov.info: .build/build $(ISTANBUL) $(TEST_FILES) $(SOURCE_FILES)
	test "$(TEST_FILES)" = "" || $(ISTANBUL) cover $(MOCHA) $(TEST_FILES)

coverage/lcov-report/index.html: coverage

.build/check-coverage: .istanbul.yml coverage
	test ! -f coverage/lcov.info || $(ISTANBUL) check
	touch $@

.build/front: .build/front-javascript
	touch $@

.build/front-javascript: package.json static/widget/js static/widget/js/main.js
	touch $@

static/widget/js:
	mkdir -p $@

BROWSERIFY=node_modules/.bin/browserify

$(BROWSERIFY): .build/install

static/widget/js/main.js: $(BROWSERIFY) node_modules/dot/doT.js src/widget/front/widget.js src/widget/front/recommendations-library.js
	$(BROWSERIFY) src/widget/front/widget.js -o $@
