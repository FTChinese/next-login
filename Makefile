.PHONY: run build tslint clean
run :
	nodemon index.js

tslint :
	tslint -c tslint.json -p tsconfig.json 

js : built/main.js built/js/progress-button.js
	rollup built/main.js --format iife --file dist/main.js

built/js/progress-button.js : client/js/progress-button.ts
	tsc client/js/progress-button.ts --outDir built/js --target es5 --module es6

built/main.js : client/main.ts
	tsc client/main.ts --outDir built --target es5 --module es6

clean :
	rm -rf build/*
