import { FormControl } from "./form-field";
import { Button } from "./button";
import { Link } from "./link";

type Method = "post" | "get";

export interface Form {
    disabled: boolean;
    method: Method;
    action: string;
    controls: FormControl[];
    submitBtn: Button;
    cacelBtn?: Link;
    deleteBtn?: Link;
}

export class FormBuilder implements Form {
    disabled: boolean;
    method: Method;
    action: string;
    controls: FormControl[];
    submitBtn: Button;
    cacelBtn?: Link | undefined;
    deleteBtn?: Link | undefined;

    constructor(form: Form) {
        this.disabled = form.disabled;
        this.method = form.method;
        this.action = form.action;
        this.controls = form.controls;
        this.submitBtn = form.submitBtn;
        this.cacelBtn = form.cacelBtn;
        this.deleteBtn = form.deleteBtn;
    }
    
    withErrors(errors: Map<string, string>): FormBuilder {
        for (let i = 0; i < this.controls.length; i++) {
            const currentControl = this.controls[i];

            currentControl.error = errors.get(currentControl.attrs.name)
        }

        return this;
    }
}
