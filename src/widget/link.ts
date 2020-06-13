export interface Link {
  text: string;
  href: string;
  external?: boolean;
}

export interface Image {
  src: string;
  alt?: string;
  href?: string; // Image with a link
}
