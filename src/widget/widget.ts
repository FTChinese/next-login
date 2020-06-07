import { InputElement } from "./element";

export interface FieldSharedAttrs {
  id: string;
  name: string;

  disabled?: boolean;
  maxlength?: number;
  minlength?: number;
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
}

export interface LabelOptions {
  text: string;
  imageUrl?: string;
  suffix?: boolean; // Should label placed after input element? Default false.
}

export interface TextAreaOptions extends FieldSharedAttrs {
  cols?: number;
  rows?: number;
  wrap?: "hard" | "soft";

  value?: string;
}

export interface TextInputOptions extends FieldSharedAttrs {
  type: 
    | "date"
    | "email"
    | "file"
    | "hidden"
    | "image"
    | "month"
    | "number"
    | "password"
    | "range"
    | "search"
    | "tel"
    | "text"
    | "time"
    | "url"
    | "week";

  value?: string | number;

  max?: number;
  min?: number;
  pattern?: string;
}

export interface RadioInputOptions extends FieldSharedAttrs {
  value: string;

  checked?: boolean;
}

export interface CheckboxInputOptions extends FieldSharedAttrs {
  checked?: boolean
}

export enum ControlType {
  Text,
  Checkbox,
  Radio,
}

export interface ControlOptions {
  label?: LabelOptions;
  controlType: ControlType;
  field: InputElement;
  desc?: string;
  error?: string;
  extraWrapperClass?: string;
}
