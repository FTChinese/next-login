import { ListItem } from "./list";
import { Link, Image } from "./link";

interface CardBody {
  title: string;
  subTitle?: string;
  text?: string[];
  links?: Link[];
}

export interface Card {
  imgTop?: Image;
  header?: string;
  body?: CardBody;
  list?: Array<ListItem>;
  footer?: string;
}
