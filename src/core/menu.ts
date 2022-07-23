import { denormalize } from 'linkset';
import type { LinkInterface, NormalizedLinksetInterface, LinksetInterface } from 'linkset';
import type { TargetAttributeValue } from 'linkset/dist/core/link';
import { buildTree, MenuElement, MenuLink } from './menu-element';
import type { MenuElementInterface } from './menu-element';

export interface MenuLinksetInterface extends LinksetInterface {
  readonly elements: MenuLink[];
}
export interface MenuInterface extends MenuLinksetInterface {
  readonly id: string;
  readonly tree: MenuElementInterface[];
}

export type NormalizedMenuInterface = NormalizedLinksetInterface;

export class Menu implements MenuInterface {
  readonly id: string;
  readonly tree: MenuElement[];
  readonly elements: MenuLink[];
  readonly size: number;
  private linkset: MenuLinksetInterface;
  constructor(machineName: string, linkset: MenuLinksetInterface) {
    this.id = machineName;
    this.linkset = linkset;
    this.elements = this.linkset.elements;
    this.size = this.linkset.size;
    this.tree = buildTree([...this.elements]);
  }

  [Symbol.iterator](): Iterator<LinkInterface> {
    const elems = this.elements;
    let pointer = 0;
    return {
      next(): IteratorResult<LinkInterface> {
        if (pointer < elems.length) {
          return { value: elems[pointer++], done: false };
        } else {
          return { value: undefined, done: true };
        }
      },
    };
  }

  /**
   * {@inheritDoc LinksetInterface.hasLinkTo}
   */
  hasLinkTo(relationType: string): boolean {
    return this.linkset.hasLinkTo(relationType);
  }
  /**
   * {@inheritDoc LinksetInterface.linkTo}
   */
  linkTo(relationType: string): MenuLink | undefined {
    return this.linkset.linkTo(relationType) as MenuLink;
  }
  /**
   * {@inheritDoc LinksetInterface.linksTo}
   */
  linksTo(relationType: string): Menu {
    return new Menu(this.id, this.linkset.linksTo(relationType) as MenuLinksetInterface);
  }
  /**
   * {@inheritDoc LinksetInterface.linksFrom}
   */
  linksFrom(anchor: string): Menu {
    return new Menu(this.id, this.linkset.linksTo(anchor) as MenuLinksetInterface);
  }
  /**
   * {@inheritdoc LinksetInterface.linksWithAttribute}
   */
  linksWithAttribute(name: string): Menu {
    return new Menu(this.id, this.linkset.linksWithAttribute(name) as MenuLinksetInterface);
  }
  /**
   * {@inheritdoc LinksetInterface.linksWithAttributeValue}
   */
  linksWithAttributeValue(name: string, value: TargetAttributeValue): Menu {
    return new Menu(this.id, this.linkset.linksWithAttributeValue(name, value) as MenuLinksetInterface);
  }
  /**
   * Creates a new menu from a normalized linkset.
   * @param normalized
   *   A normalized linkset.
   * @param menuID
   *   A menu machine name.o
   * @returns a new Menu object containing only link elements belonging to the given menu.
   */
  static from(normalized: NormalizedMenuInterface, menuID?: string): Menu | Menu[] {
    const linkset = denormalize(normalized);
    const machineNames: string[] = [];
    if (!menuID) {
      linkset.linksWithAttribute('machine-name').elements.forEach((link: LinkInterface) => {
        if (!machineNames.includes(link.attributes['machine-name'][0])) {
          machineNames.push(link.attributes['machine-name'][0]);
        }
      });
    } else {
      machineNames.push(menuID);
    }
    const menus = machineNames.map((machineName) => {
      return new Menu(
        machineName,
        linkset.linksWithAttributeValue('machine-name', machineName) as unknown as MenuLinksetInterface,
      );
    });
    return menuID ? menus.shift() : menus;
  }
}
