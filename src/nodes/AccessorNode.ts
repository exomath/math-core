import { Node, IdentifierNode } from '.';
import { assert, hasType } from '..';

const TYPE = 'AccessorNode';

export class AccessorNode extends Node {
  private constructor(
    public readonly identifier: AccessorNode | IdentifierNode,
    public readonly index: IdentifierNode | Node[]
  ) {
    super(TYPE);

    assert(
      AccessorNode.isAccessorNode(identifier) || IdentifierNode.isIdentifierNode(identifier),
      '"identifier" must be of type AccessorNode | IdentifierNode',
      TYPE
    );

    assert(
      IdentifierNode.isIdentifierNode(index) || Node.isNodeArray(index),
      '"index" must be of type IdentifierNode | *Node[]',
      TYPE
    );
  }

  public static new(identifier: AccessorNode | IdentifierNode, index: IdentifierNode | Node[]) {
    return Object.freeze(new AccessorNode(identifier, index));
  }

  public static isAccessorNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}