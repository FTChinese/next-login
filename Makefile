cmd_prefix := ./node_modules/.bin

BUILD_DIR := build
BINARY := next-user
LINUX_BIN := $(BINARY)-linux
MAC_BIN := $(BINARY)-macos
ENTRY := dist/server.js

.PHONY: start watchts watchode build run pkg deploy clean

start :
	$(cmd_prefix)/nodemon

watchts :
	$(cmd_prefix)/tsc -w

watchnode :
	${cmd_prefix}/nodemon --ext js  --ignore src/ dist/server.js

test :
	${cmd_prefix}/jest --forceExit --coverage --verbose

watchtest :
	${cmd_prefix}/jest --forceExit --coverage --verbose --watchAll

watch :
	${cmd_prefix}/concurrently -k -p "[{name}]" -n "TypeScript,Node" -c "cyan.bold,green.bold" "$(cmd_prefix)/tsc -w" "${cmd_prefix}/nodemon dist/server.js"

buildts :
	$(cmd_prefix)/tsc

lint :
	${cmd_prefix}/tsc --noEmit && ${cmd_prefix}/eslint "**/*.{js,ts}" --quiet --fix

run :
	NODE_ENV=production ./$(BUILD_DIR)/@ftchinese/$(MAC_BIN)

pkg :
	pkg --targets node14-linux-x64,node14-macos-x64 -c package.json --out-path $(BUILD_DIR) $(ENTRY)

deploy : clean buildts pkg
	rsync -v ./$(BUILD_DIR)/@ftchinese/$(LINUX_BIN) tk11:/home/node/next/
	ssh tk11 supervisorctl restart $(BINARY)

clean :
	rm -rf dist/** && rm -rf build/@ftchinese/**
