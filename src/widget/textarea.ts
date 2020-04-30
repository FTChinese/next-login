import { Attributes } from "./attributes";
import { FieldSharedAttrs } from "./widget";
import { InputElement } from "./element";

export interface TextAreaOptions extends FieldSharedAttrs {
  cols?: number;
  rows?: number;
  wrap?: "hard" | "soft";

  value?: string;
}

export class TextArea extends InputElement {

  constructor(opts: TextAreaOptions) {
    super("textarea");

    this.id = opts.id;
    this.name = opts.name;
    
    if (opts.value) {
      this.textContent = opts.value;
    }

    this.attrs = Attributes.fieldSharedAttrs(opts);

    if (opts.cols) {
      this.attrs.set("cols", `${opts.cols}`);
    }

    if (opts.rows) {
      this.attrs.set("rows", `${opts.rows}`);
    }

    if (opts.wrap) {
      this.attrs.set("wrap", `${opts.wrap}`);
    }
  }
}
