build_dir := build
outfile := doc
inputfiles := src/metadata.md ../README.md src/signup.md src/login.md src/password-reset.md src/profile.md

.PHONY: html pdf builddir image clean

pdf : builddir image
	pandoc -s --toc --resource-path=.:img --pdf-engine=xelatex -o $(build_dir)/$(outfile).pdf $(inputfiles)

word : builddir image
	pandoc -s --toc --resource-path=.:img -o $(build_dir)/$(outfile).docx $(inputfiles)

html : builddir image
	pandoc -s --toc --resource-path=.:img -o $(build_dir)/$(outfile).html $(inputfiles)

epub : createdir image
	pandoc -s --toc --resource-path=.:img -o $(build_dir)/$(outfile).epub $(inputfiles)

builddir :
	mkdir -p $(build_dir)

image :
	sh chart.sh

clean :
	rm -r build/*