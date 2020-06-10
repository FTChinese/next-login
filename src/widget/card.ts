import { ListItem } from "./list";
import { Link } from "./link";

interface Image {
  src: string;
  alt?: string;
}

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
