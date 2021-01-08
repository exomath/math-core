import { Node, AccessorNode, IdentifierNode } from './';
import { hasType } from '../utils';

const TYPE = 'AssignmentNode';

export class AssignmentNode extends Node {
  public constructor(
    public readonly identifier: AccessorNode | IdentifierNode,
    public readonly value: Node
  ) {
    super(TYPE);

    if (!(AccessorNode.isAccessorNode(identifier) || IdentifierNode.isIdentifierNode(identifier))) {
      throw new TypeError(`${TYPE}: "identifier" must be of type AccessorNode | IdentifierNode`);
    }

    if (!Node.isNode(value)) {
      throw new TypeError(`${TYPE}: "content" must be of type *Node`);
    }
  }

  public static new(identifier: AccessorNode | IdentifierNode, value: Node) {
    return Object.freeze(new AssignmentNode(identifier, value));
  }

  public static isAssignmentNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}