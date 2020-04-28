import { FieldSharedAttrs } from "./widget";

export class Attributes {
    private attrs: Map<string, string[]> = new Map();

    add(name: string, value: string): Attributes {
        const values = this.attrs.get(name);
        if (values) {
            values.push(value);
        } else {
            this.set(name, value)
        }

        return this;
    }
    
    set(name: string, value: string): Attributes {
        this.attrs.set(name, [value]);
        return this;
    }

    // A space separated string.
    setClassNames(value: string): Attributes {
        return this.set("class", value);
    }

    addClassName(value: string): Attributes {
      return this.add("class", value);
    }
    
    setBoolean(name: string): Attributes {
        this.attrs.set(name, [""]);
        return this;
    }

    withRequired(): Attributes {
        this.setBoolean("required");
        return this;
    }

    withDisabled(): Attributes {
        this.setBoolean("disabled");
        return this;
    }

    build(): string {
        return Array.from(this.attrs.entries()).map(([name, value]) => {
            if (value.length === 1 && value[0] === "") {
                return name;
            }
            
            return `${name}="${value.join(' ')}"`;
        })
        .join(' ');
    }

    static formField(f: FieldSharedAttrs): Attributes {
      const attrs = (new Attributes())
        .set("id", f.id)
        .set("name", f.name);
      
      if (f.disabled) {
        attrs.setBoolean("disabled");
      }
    
      if (f.maxlength) {
        attrs.set("maxlength", `${f.maxlength}`);
      }
    
      if (f.minlength) {
        attrs.set("minlength", `${f.minlength}`);
      }
    
      if (f.placeholder) {
        attrs.set("placeholder", `${f.placeholder}`);
      }
    
      if (f.readonly) {
        attrs.setBoolean("readonly");
      }
    
      if (f.required) {
        attrs.setBoolean("required");
      }
    
      return attrs;
    }
}
