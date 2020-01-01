cmd_prefix := ./node_modules/.bin

BUILD_DIR := build
BINARY := next-user
LINUX_BIN := $(BINARY)-linux
MAC_BIN := $(BINARY)-macos
ENTRY := dist/server.js

.PHONY: ts run pkg deploy clean

ts :
	$(cmd_prefix)/tsc

run :
	NODE_ENV=production ./$(BUILD_DIR)/@ftchinese/$(MAC_BIN)

pkg :
	pkg --targets node12-linux-x64,node12-macos-x64 -c package.json --out-path $(BUILD_DIR) $(ENTRY)

deploy : clean ts pkg
	rsync -v ./$(BUILD_DIR)/@ftchinese/$(LINUX_BIN) tk11:/home/node/next/
	ssh tk11 supervisorctl restart $(BINARY)

clean :
	rm -rf dist/**
