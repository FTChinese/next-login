cmd_prefix := ./node_modules/.bin
build_prod := build/production
scss_input := client/scss/main.scss
css_output := $(build_prod)/main.css

.PHONY: server js css inline deploy tslint clean
server :
	nodemon index.js

tslint :
	tslint -c tslint.json -p tsconfig.json 

js : 
	$(cmd_prefix)/rollup -c

css :
	$(cmd_prefix)/node-sass --output-style=compressed --source-map=$(build_prod) --include-path=node_modules/bootstrap $(scss_input) $(css_output)

inline : js css
	node ./util/inline.js

deploy :
	pm2 deploy ecosystem.config.js production

clean :
	rm -rf build/*
