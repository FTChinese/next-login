import { Link } from "./link";

export interface ListItem {
  label: string;
  value?: string;
  link?: Link;
}

interface TableCell {
  left: string;
  right: string;
}

export interface TableRow {
  cells: TableCell[];
  disclosure: Link;
}

export interface TableSection {
  header?: string;
  rows: TableRow[];
}
