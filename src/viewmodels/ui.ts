export type SavedKey = "saved" | "password_saved";
export type ActionDoneKey = "letter_sent" | "password_reset";

const doneMsg = {
    saved: "保存成功！",
    pwSaved: "密码修改成功",
};

export function getDoneMsg(key: SavedKey): string {
    switch (key) {
        case "saved":
            return doneMsg.saved;

        case "password_saved":
            return doneMsg.pwSaved;

        default:
            return "";
    }
}

export interface IUpdateResult<T> {
    success?: boolean;
    errForm?: T;
    errApi?: IErrors;
}

export interface IDataList {
    id: string;
    options: Array<string>;
}

export interface ITextInput {
    label: string;
    id: string;
    type: string;
    name: string;
    value?: string | null;
    placeholder?: string;
    required?: boolean;
    readonly?: boolean;
    minlength?: string;
    maxlength?: string;
    desc?: string;
    error?: string | null;
    datalist?: IDataList;
}

export interface ICheckBoxInput {
    label: string;
    id: string;
    value: string;
    checked: boolean;
}

export interface ICheckBox {
    title?: string;
    name: string;
    items: Array<ICheckBoxInput>
    desc?: string;
    error?: string;
}

export interface IRadioInput {
    label: string;
    imageUrl?: string;
    gap?: number;
    id: string;
    value: string;
    checked: boolean;
}

export interface IRadio {
    title?: string;
    name: string;
    inputs: Array<IRadioInput>;
    required?: boolean;
    desc?: string;
    error?: string;
}

export interface ISelectOption {
    value: string;
    text: string;
    selected: boolean;
}

export interface IListItem {
    label: string;
    value?: string;
    link?: string;
    linkText?: string;
}

export interface IAnchor {
    href: string;
    text: string;
}
// UI components to show a raw error message as last resort if the error cannot be built programatically.
export interface IErrors {
    message: string;
}

// UI components to show a known error or alert message.
export interface IAlert {
    message: string;
    link?: IAnchor;
}

export interface IActionDone {
    message: string;
    link?: IAnchor;
}

export interface UIBase {
    errors?: IErrors;
    alert?: IAlert;
}

export interface UISingleInput extends UIBase {
    input: ITextInput;
}

export interface UIMultiInputs extends UIBase {
    inputs: Array<ITextInput>;
}
