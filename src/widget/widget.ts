import { Attributes } from "./attributes";

export interface Widget {
  render(): string
}

export interface FormWidget extends Widget {
  readonly id: string;
  readonly name: string;
}

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
  suffix?: boolean; // Should label placed after input element? Default false.
}

export interface TextAreaOptions extends FieldSharedAttrs {
  cols?: number;
  rows?: number;
  wrap?: "hard" | "soft";

  value?: string;
}

export interface InputOptions extends FieldSharedAttrs {
  type: 
    | "checkbox"
    | "date"
    | "email"
    | "file"
    | "hidden"
    | "image"
    | "month"
    | "number"
    | "password"
    | "radio"
    | "range"
    | "search"
    | "tel"
    | "text"
    | "time"
    | "url"
    | "week";

  value?: string | number;

  checked?: boolean;
  max?: number;
  min?: number;
  pattern?: string;
}

export enum ControlType {
  Text,
  Checkbox,
  Radio,
}

export interface ControlOptions {
  label?: LabelOptions;
  controlType: ControlType;
  field: FormWidget;
  desc?: string;
  error?: string;
}
