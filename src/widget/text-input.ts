import { TextInputOptions } from "./widget";
import { Attributes } from "./attributes";
import { InputElement } from "./element";

export class TextInputElement extends InputElement {

  readonly value?: string | number;

  constructor(opts: TextInputOptions) {
    super("input");
    this.withSeflClosing();

    this.id = opts.id;
    this.name = opts.name;
    this.value = opts.value;

    // Add all shared attributes of any field.
    this.attrs = Attributes.fieldSharedAttrs(opts)
      .set("type", opts.type)
      .setClassNames("form-control");

    if (opts.value) {
      this.attrs.set("value", `${opts.value}`);
    }

    if (opts.max) {
      this.attrs.set("max", `${opts.max}`);
    }

    if (opts.min) {
      this.attrs.set("min", `${opts.min}`);
    }

    if (opts.pattern) {
      this.attrs.set("pattern", opts.pattern);
    }
  }
}
