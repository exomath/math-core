import { Node, IdentifierNode } from '.';
import { hasType } from '../utils';

const TYPE = 'AccessorNode';

export class AccessorNode extends Node {
  public constructor(
    public readonly identifier: AccessorNode | IdentifierNode,
    public readonly index: IdentifierNode | Node[]
  ) {
    super(TYPE);

    if (!(AccessorNode.isAccessorNode(identifier) || IdentifierNode.isIdentifierNode(identifier))) {
      throw new TypeError(`${TYPE}: "identifier" must be of type AccessorNode | IdentifierNode`);
    }

    if (!(IdentifierNode.isIdentifierNode(index) || Node.isNodeArray(index))) {
      throw new TypeError(`${TYPE}: "index" must be of type IdentifierNode | *Node[]`);
    }
  }

  public static new(identifier: AccessorNode | IdentifierNode, index: IdentifierNode | Node[]) {
    return Object.freeze(new AccessorNode(identifier, index));
  }

  public static isAccessorNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}