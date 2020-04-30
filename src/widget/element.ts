import { Attributes } from "./attributes";

/**
 * @description An HTML element.
 * Currently only support wraping text.
 */
export class Element {
  
  attrs?: Attributes;
  textContent?: string;

  private tagName: string;
  private children?: Element[];
  private selfClosing: boolean = false;

  constructor (tagName: string) {
    this.tagName = tagName
  }

  withSeflClosing(): Element {
    this.selfClosing = true;
    return this;
  }

  withText(t: string): Element {
    this.textContent = t;
    return this;
  }

  withAttributes(attrs: Attributes): Element {
    this.attrs = attrs;
    return this;
  }

  appendChild(elem: Element): Element {
    if (!this.children) {
      this.children = [elem];
    } else {
      this.children.push(elem);
    }

    return this;
  }

  render(): string {

    let str = `<${this.tagName}`
    if (this.attrs) {
      str += ' ';
      str += this.attrs.build();
    }
    if (this.selfClosing) {
      str += "/>";
      return str;
    }

    str += ">";

    if (this.children) {
      str += this.children.map(elem => elem.render()).join('');
    } else if (this.textContent) {
      str += this.textContent;
    }

    str += `</${this.tagName}>`;

    return str;
  }
}

export class InputElement extends Element {
  id: string;
  name: string;
}
