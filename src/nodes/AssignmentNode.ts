import { Node, AccessorNode, IdentifierNode } from '.';
import { assert, hasType } from '..';

const TYPE = 'AssignmentNode';

export class AssignmentNode extends Node {
  private constructor(
    public readonly identifier: AccessorNode | IdentifierNode,
    public readonly value: Node
  ) {
    super(TYPE);

    assert(
      AccessorNode.isAccessorNode(identifier) || IdentifierNode.isIdentifierNode(identifier),
      '"identifier" must be of type AccessorNode | IdentifierNode',
      TYPE
    );

    assert(Node.isNode(value), '"content" must be of type *Node', TYPE);
  }

  public static new(identifier: AccessorNode | IdentifierNode, value: Node) {
    return Object.freeze(new AssignmentNode(identifier, value));
  }

  public static isAssignmentNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}