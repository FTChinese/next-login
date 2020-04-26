import { Attributes } from "./attributes";

type BtnType = "button" | "submit";
type BtnStyle = "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "light" | "dark" | "link";
type BtnSize = "sm" | "lg" | "block";

/**
 * @description Build a button's appearance.
 * Using Bootstrap class: btn btn-primary/btn-outline-primary btn-block
 */
export class Button {
    text: string = "";
    type: BtnType = "submit";
    disableWith?: string;
    private style?: BtnStyle;
    private size?: BtnSize;
    private outline?: boolean;

    setName(s: string): Button {
        this.text = s;
        return this;
    }

    setDisableWith(s: string): Button {
        this.disableWith = s;
        return this;
    }

    setType(t: BtnType): Button {
        this.type = t;
        return this;
    }

    setStyle(s: BtnStyle): Button {
        this.style = s;
        return this;
    }

    setSize(s: BtnSize): Button {
        this.size = s;
        return this;
    }

    setBlock(): Button {
        this.size = "block";
        return this;
    }

    get classNames(): string {
        const names = ["btn"];

        // A string like: btn-outline-primary or btn-primary
        if (this.style) {
            names.push(`btn${this.outline ? '-outline' : '-'}${this.style}`)
        }

        // A string like btn-block
        if (this.size) {
            names.push(`btn-${this.size}`);
        }

        return names.join(' ');
    }

    get attributes(): string {
        const attrs = new Attributes();
        attrs.setClassNames(this.classNames)
            .set("type", this.type)
        
        if (this.disableWith) {
            attrs.set("data-disable-with", this.disableWith)
        }

        return attrs.build();
    }

    static primary(): Button {
        return new Button()
            .setStyle("primary")
    }

    static secondary(): Button {
        return new Button()
            .setStyle("secondary");
    }
}
