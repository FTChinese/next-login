import { Flash } from "../widget/flash";
import { Form } from "../widget/form";

export interface FormPage {
  pageTitle: string;
  heading: string;
  flash?: Flash;
  form?: Form;
}
