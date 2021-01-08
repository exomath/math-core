import { Node } from './';
import { hasType, isString } from '../utils';

const TYPE = 'IdentifierNode';

export class IdentifierNode extends Node {
  public constructor(
    public readonly name: string
  ) {
    super(TYPE);

    if (!isString(name)) {
      throw new TypeError(`${TYPE}: "name" must be of type string`);
    }
  }

  public static new(name: string) {
    return Object.freeze(new IdentifierNode(name));
  }

  public static isIdentifierNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}