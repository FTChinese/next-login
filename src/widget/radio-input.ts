import { InputElement } from "./element";
import { RadioInputOptions, CheckboxInputOptions } from "./widget";
import { Attributes } from "./attributes";

export class RadioInputElement extends InputElement {
  constructor(opts: RadioInputOptions) {
    super("input");

    this.id = opts.id;
    this.name = opts.name;

    this.attrs = Attributes.fieldSharedAttrs(opts)
      .set("type", "radio")
      .set("value", opts.value)
      .setClassNames("form-check-input");

    if (opts.checked) {
      this.attrs.setBoolean("checked");
    }
  }
}

export class CheckboxInputElement extends InputElement {
  constructor(opts: CheckboxInputOptions) {
    super("input");
    this.id = opts.id;
    this.name = opts.name;

    this.attrs = Attributes.fieldSharedAttrs(opts)
      .set("type", "checkbox")
      .set("value", "true")
      .setClassNames("form-check-input");

    if (opts.checked) {
      this.attrs.setBoolean("checked");
    }
  }
}
