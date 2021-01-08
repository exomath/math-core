import { Node } from './';
import { hasType, isString } from '../utils';

const TYPE = 'IdentifierNode';

export class IdentifierNode extends Node {
  public constructor(
    public readonly identifier: string
  ) {
    super(TYPE);

    if (!isString(identifier)) {
      throw new TypeError(`${TYPE}: "identifier" must be of type string`);
    }
  }

  public static new(identifier: string) {
    return Object.freeze(new IdentifierNode(identifier));
  }

  public static isIdentifierNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}