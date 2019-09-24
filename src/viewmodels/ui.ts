export const alerts = new Map([
    ["saved", "保存成功！"],
    ["password_saved", "密码修改成功"],
]);

export interface DataList {
    id: string;
    options: Array<string>;
}

export interface TextInput {
    label: string;
    id: string;
    type: string;
    name: string;
    value?: string | null;
    placeholder: string;
    required: boolean;
    readonly?: boolean;
    minlength?: string;
    maxlength?: string;
    desc?: string;
    error?: string | null;
    datalist?: DataList;
}

export interface CheckBoxInput {
    label: string;
    id: string;
    value: string;
    checked: boolean;
}

export interface SelectOption {
    value: string;
    text: string;
    selected: boolean;
}

export interface ListItem {
    label: string;
    text: string;
    link?: string;
}

export interface UIApiErrorBase {
    message?: string;
}

export interface Alert {
    message: string;
    href?: string;
    linkText?: string;
}
