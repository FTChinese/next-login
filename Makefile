cmd_prefix := ./node_modules/.bin

BUILD_DIR := build
BINARY := next-user
LINUX_BIN := $(BINARY)-linux
MAC_BIN := $(BINARY)-macos
ENTRY := dist/server.js

.PHONY: start watchts watchode build run pkg deploy clean

start :
	$(cmd_prefix)/nodemon --ext ts --ignore dist/ --exec ${cmd_prefix}/ts-node src/server.ts

watchts :
	$(cmd_prefix)/tsc -w

watchnode :
	${cmd_prefix}/nodemon --ext js  --ignore src/ dist/server.js

build :
	$(cmd_prefix)/tsc

run :
	NODE_ENV=production ./$(BUILD_DIR)/@ftchinese/$(MAC_BIN)

pkg :
	pkg --targets node13-linux-x64,node13-macos-x64 -c package.json --out-path $(BUILD_DIR) $(ENTRY)

deploy : clean build pkg
	rsync -v ./$(BUILD_DIR)/@ftchinese/$(LINUX_BIN) tk11:/home/node/next/
	ssh tk11 supervisorctl restart $(BINARY)

clean :
	rm -rf dist/** && rm -rf build/@ftchinese/**
