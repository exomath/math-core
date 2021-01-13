import { Node, IdentifierNode } from '.';
import { hasType, isNull } from '..';

const TYPE = 'RecordNode';

export class RecordNode extends Node {
  private constructor(
    public readonly map: Map<IdentifierNode, Node>,
    public readonly primary: IdentifierNode | null = null
  ) {
    super(TYPE);

    if (!(map instanceof Map)) {
      throw new TypeError(`${TYPE}: "map" must be of type Map<IdentifierNode, *Node>`);
    }

    if (!(IdentifierNode.isIdentifierNode(primary) || isNull(primary))) {
      throw new TypeError(`${TYPE}: "primary" must be of type IdentifierNode | null`);
    }
  }

  public static new(map: Map<IdentifierNode, Node>, primary: IdentifierNode | null = null) {
    return Object.freeze(new RecordNode(map, primary));
  }

  public static isRecordNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}