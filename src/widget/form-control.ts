import { FormWidget, LabelOptions, ControlOptions, ControlType } from "./widget";

class ControlDesc {
  readonly desc: string;

  constructor (desc: string) {
    this.desc = desc;
  }
  
  render(): string {
    return `<small class="form-text text-muted">${this.desc}</small>`;
  }
}

class ControlError {
  readonly msg: string;

  constructor (msg: string) {
    this.msg = msg;
  }

  render(): string {
    return `<div class="form-errortext">${this.msg}</div>` 
  }
}

export class ControlGroup {
  readonly label?: LabelOptions;
  readonly controlType: ControlType;
  readonly field: FormWidget;
  readonly desc?: ControlDesc;
  error?: ControlError
  
  constructor (opts: ControlOptions) {
    if (opts.label) {
      this.label = opts.label
    }

    this.field = opts.field;

    if (opts.desc) {
      this.desc = new ControlDesc(opts.desc);
    }

    if (opts.error) {
      this.error = new ControlError(opts.error);
    }
  }

  setError(msg?: string) {
    if (msg) {
      this.error = new ControlError(msg);
    }
  }

  buildLabelAndField(): string {
    if (!this.label) {
      return this.field.render();
    }

    const labelElm = `<label class="form-label" for="${this.field.id}">${this.label.text}</label>`;

    return this.label.suffix 
      ? this.field.render() + labelElm
      : labelElm + this.field.render();
  }

  get wrapperClassName(): string {
    switch (this.controlType) {
      case ControlType.Checkbox:
      case ControlType.Radio:
        return "form-check";

      case ControlType.Text:
        return "form-group";
    }
  }

  render(): string {
    return `<div class="${this.wrapperClassName}">
    ${this.buildLabelAndField()}
    ${this.desc?.render()}
    ${this.error?.render()}
    </div>`
  }
}
