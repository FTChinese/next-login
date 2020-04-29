import { Button } from "./button";
import { Link } from "./link";
import { ControlGroup } from "./form-control";

type Method = "post" | "get";

export interface FormOptions {
    disabled: boolean;
    method: Method;
    action: string;
    controls: ControlGroup[];
    submitBtn: Button;
    cacelBtn?: Link;
    deleteBtn?: Link;
}

export class Form implements FormOptions {
    disabled: boolean;
    method: Method;
    action: string;
    controls: ControlGroup[];
    submitBtn: Button;
    cacelBtn?: Link | undefined;
    deleteBtn?: Link | undefined;

    constructor(opts: FormOptions) {
        this.disabled = opts.disabled;
        this.method = opts.method;
        this.action = opts.action;
        this.controls = opts.controls;
        this.submitBtn = opts.submitBtn;
        this.cacelBtn = opts.cacelBtn;
        this.deleteBtn = opts.deleteBtn;
    }
    
    withErrors(errors: Map<string, string>): Form {
        for (let i = 0; i < this.controls.length; i++) {
            const currentControl = this.controls[i];

            currentControl.setError(errors.get(currentControl.field.name));
        }

        return this;
    }
}
