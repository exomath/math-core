import {
  Node,
  AccessorNode,
  IdentifierNode
} from './';

const validIdentifierClasses = ['AccessorNode', 'IdentifierNode'];

export class AssignmentNode implements Node {
  public readonly class = 'AssignmentNode';

  constructor(
    public readonly identifier: AccessorNode | IdentifierNode,
    public readonly value: Node
  ) {
    if (!(typeof identifier === 'object' && identifier.hasOwnProperty('class') && validIdentifierClasses.includes(identifier.class))) {
      throw new TypeError(`AssignmentNode: "identifier" must be of class "${validIdentifierClasses.join('" | "')}"`);
    }

    if (!(typeof value === 'object' && value.hasOwnProperty('class') && value.class.endsWith('Node'))) {
      throw new TypeError('AssignmentNode: "content" must be of class "Node"');
    }
  }

  public static new(identifier: AccessorNode | IdentifierNode, value: Node) {
    return Object.freeze(new AssignmentNode(identifier, value));
  }
}