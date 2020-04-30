import { ControlOptions, ControlType } from "./widget";
import { Element, InputElement } from "./element";

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

function isCheck(controlType: ControlType): boolean {
  return (controlType === ControlType.Checkbox) || (controlType === ControlType.Radio);
}

export class FormControl {
  // Determing containing div class names:
  // form-check for checkbox and radio,
  // form-group otherwise.
  readonly controlType: ControlType;
  // The field element like input, textarea, select.
  readonly field: InputElement;

  private suffixLabel = false;

  readonly label?: Element;
  private desc?: Element;
  private error?: Element
  
  constructor (opts: ControlOptions) {
    const isCheckOrRadio = isCheck(opts.controlType);

    this.field = opts.field;

    if (opts.label) {
      this.label = (new Element("label"))
        .withText(opts.label.text)
        .setAttribute("for", opts.field.id)
        .addClass(`${isCheckOrRadio ? 'form-check-label' : 'form-label'}`);

      this.suffixLabel = opts.label.suffix || false;
    }

    if (opts.desc) {
      this.setDesc(opts.desc);
    }

    if (opts.error) {
      this.setError(opts.error);
    }
  }

  setDesc(desc: string): FormControl {
    this.desc = (new Element("small"))
      .addClass("form-text text-muted")
      .withText(desc);

    return this;
  }

  setError(errMsg: string): FormControl {
    this.error = (new Element("div"))
      .addClass("form-errortext")
      .withText(errMsg);
    return this;
  }

  render(): string {
    const elems: Element[] = [];

    if (this.label) {
      if (this.suffixLabel) {
        elems.push(this.field);
        elems.push(this.label)
      } else {
        elems.push(this.label)
        elems.push(this.field);
      }
    } else {
      elems.push(this.field);
    }

    if (this.desc) {
      elems.push(this.desc);
    }

    if (this.error) {
      elems.push(this.error);
    }

    return elems.map(elem => elem.render()).join("");
  }
}
