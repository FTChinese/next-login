cmd_prefix := ./node_modules/.bin
build_prod := build/production
scss_input := client/scss/main.scss
css_output := $(build_prod)/main.css

BUILD_DIR := build
BINARY := next-user
LINUX_BIN := next-user-linux
MAC_BIN := next-user-macos
ENTRY := dist/server.js

.PHONY: tslint js css inline clean ts run build deploy

tslint :
	tslint -c tslint.json -p tsconfig.json 

js : 
	$(cmd_prefix)/rollup -c

css :
	$(cmd_prefix)/node-sass --output-style=compressed --source-map=$(build_prod) --include-path=node_modules/bootstrap $(scss_input) $(css_output)

inline : js css
	node ./util/inline.js


clean :
	rm -rf build/*

ts :
	rm -rf dist/** && tsc

run :
	NODE_ENV=production ./$(BUILD_DIR)/@ftchinese/$(MAC_BIN)

build :
	pkg --targets node12-linux-x64,node12-macos-x64 -c package.json --out-path $(BUILD_DIR) $(ENTRY)

deploy :
	rsync -v ./$(BUILD_DIR)/@ftchinese/$(LINUX_BIN) tk11:/home/node/next/
	ssh tk11 supervisorctl restart $(BINARY)
