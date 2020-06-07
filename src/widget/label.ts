import { Element } from "./element";
import { LabelOptions } from "./widget";

export class Label extends Element {

  readonly suffix: boolean

  constructor(opts: LabelOptions) {
    super("label");

    if (opts.imageUrl) {
      const img = (new Element("img"))
        .setAttribute('src', opts.imageUrl)
        .setAttribute("alt", opts.text);

      this.appendChild(img);
    } else {
      this.withText(opts.text)
    }

    this.suffix = opts.suffix ? true : false;
  }
}
