## Usage Guide

To produce a PDF file you must have those installed:

LaTex and XeLaTex. On Mac you can use [MacTeX](https://tug.org/mactex/) or BasicTeX. `MacTeX` will install all packages you related to LaTeX but it takes several GB of disk space. `BasicTeX` is much smaller but you have to install an additional package [fvextra](https://ctan.org/pkg/fvextra) manually to enable line break in code block:

```
sudo tlmgr update --self
sudo tlmgr install fvextra
```

Install fonts: `Noto Serif`, `Noto Sans`, `Noto Sans Mono CJK SC`, `Noto Sans CJK SC`, `Latin Modern Math` so that LaTex could handle Unicode characters.

Install [pandoc](http://pandoc.org/): `brew install pandoc`

Install [graphviz](https://www.graphviz.org/) so that you could use the `dot` program to convert dot files into image files.

## Use the Makefile

`cd` into `_docs` and you have those `make` targets:

* `make` generate a PDF file by default.
* `make html` generates a single page HTML file.
* `make word` Geneate a docx file.
* `make epub` generates an epub file
* `make image` converts dot files to png.
* `make clean` clears `_docs/build` directory.