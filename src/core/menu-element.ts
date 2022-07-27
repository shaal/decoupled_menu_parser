import type { LinkInterface } from 'linkset';

export interface MenuElementInterface {
  readonly title?: string;
  readonly link: LinkInterface;
  readonly children: MenuElementInterface[];
}

export type MenuLink = {
  attributes: {
    ['machine-name']: string[];
    ['hierarchy']: string[];
  };
} & LinkInterface;

export class MenuElement implements MenuElementInterface {
  readonly link: LinkInterface;
  readonly children: MenuElementInterface[];
  constructor(link: MenuLink, children: MenuLink[] = []) {
    this.link = link;
    this.children = buildTree([...children]);
  }
  get title(): string | undefined {
    return this.link.attributes.title;
  }
}

export function hierarchyCompare(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0; // Nothing to sort
  if (a.length === 0 && b.length > 0) return -1; // End of A hierarchy
  if (a.length > 0 && b.length === 0) return 1;  // End of B hierarchy
  // Compare the end of both hierarchies
  if (a.length === 1 && b.length === 1 ) return parseInt(a[0]) - parseInt(b[0]);
  // If the top levels are equal, compare the children
  if (a[0] === b[0]) return hierarchyCompare(a.slice(1), b.slice(1))
  // Compare the top levels
  return parseInt(a[0]) - parseInt(b[0]);
}

export function buildTree(links: MenuLink[]): MenuElement[] {
  // If there aren't any links or there is only one link, take a shortcut and return early.
  if (links.length < 2) {
    return links.length ? [new MenuElement(links.shift())] : [];
  }
  // Sorting by the hierarchy key is essential to capture link order and for the algorithm below to correctly build
  // subtrees.
  links.sort((a: MenuLink, b: MenuLink): number => hierarchyCompare(a.attributes['hierarchy'], b.attributes['hierarchy']));
  const elements = [];
  let last;
  let children = [];
  do {
    const curr = links.shift();
    if (last) {
      if (curr.attributes['hierarchy'].length > last.attributes['hierarchy'].length) {
        children.push(curr);
      } else {
        elements.push(new MenuElement(last, children));
        last = curr;
        children = [];
      }
    } else {
      last = curr;
    }
  } while (links.length);
  elements.push(new MenuElement(last, children));
  return elements;
}
