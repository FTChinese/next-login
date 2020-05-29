import { FieldSharedAttrs } from "./widget";

/**
 * @description An HTML element.
 * Currently only support wraping text.
 */
export class Element {
  
  classList: string[] = [];
  private attrs: Map<string, string> = new Map();
  textContent?: string;

  private tagName: string;
  private children?: Element[];
  private selfClosing: boolean = false;

  constructor (tagName: string) {
    this.tagName = tagName
  }

  // Use empty space for boolean value.
  setAttribute(name: string, value: string): Element {
    this.attrs.set(name, value);
    return this;
  }

  addClass(value: string): Element {
    this.classList.push(value);
    return this;
  }

  withSeflClosing(): Element {
    this.selfClosing = true;
    return this;
  }

  withText(t: string): Element {
    this.textContent = t;
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

  private buildAttributes(): string {
    return Array.from(this.attrs.entries()).map(([name, value]) => {
      if (value === "") {
          return name;
      }
      
      return `${name}="${value}"`;
    })
    .join(' ');
  }

  private renderChildren(): string {
    if (this.children) {
      return this.children.map(elem => elem.render()).join('');
    } else if (this.textContent) {
      return this.textContent;
    }

    return "";
  }

  render(): string {

    let str = `<${this.tagName}`
    if (this.attrs.size > 0) {
      str += ' ';
      str += this.buildAttributes();
    }
    if (this.classList.length > 0) {
      str += ` class="${this.classList.join(' ')}"`;
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

export abstract class InputElement extends Element {
  id: string;
  name: string;

  addSharedAttributes(f: FieldSharedAttrs) {
    this.setAttribute("id", f.id);
    this.setAttribute("name", f.name);

    if (f.disabled) {
      this.setAttribute("disabled", "");
    }
  
    if (f.maxlength) {
      this.setAttribute("maxlength", `${f.maxlength}`);
    }
  
    if (f.minlength) {
      this.setAttribute("minlength", `${f.minlength}`);
    }
  
    if (f.placeholder) {
      this.setAttribute("placeholder", `${f.placeholder}`);
    }
  
    if (f.readonly) {
      this.setAttribute("readonly", "");
    }
  
    if (f.required) {
      this.setAttribute("required", "");
    }
  }
}
