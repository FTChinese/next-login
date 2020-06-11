import { Link } from "./link";

export interface ListItem {
  primary: string;
  secondary?: string;
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

export interface SimpleList {
  header?: string;
  rows: string[];
}

// The structure for HTML table.
export interface Table {
  caption?: string;
  rows: Array<string[]>;
}
