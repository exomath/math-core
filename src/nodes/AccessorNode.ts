import {
  Node,
  IdentifierNode
} from './';

export class AccessorNode implements Node {
  public readonly class = 'AccessorNode';

  constructor(
    public readonly identifier: AccessorNode | IdentifierNode,
    public readonly index: IdentifierNode | Node[]
  ) {
    // Validate arguments
  }

  public static new(identifier: AccessorNode | IdentifierNode, index: IdentifierNode | Node[]) {
    return Object.freeze(new AccessorNode(identifier, index));
  }
}