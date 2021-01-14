import { Node, IdentifierNode } from '.';
import { assert, hasType, isNull } from '..';

const TYPE = 'RecordNode';

export class RecordNode extends Node {
  private constructor(
    public readonly map: Map<IdentifierNode, Node>,
    public readonly primary: IdentifierNode | null = null
  ) {
    super(TYPE);

    assert(map instanceof Map, '"map" must be of type Map<IdentifierNode, *Node>', TYPE);

    assert(
      IdentifierNode.isIdentifierNode(primary) || isNull(primary),
      '"primary" must be of type IdentifierNode | null',
      TYPE
    );
  }

  public static new(map: Map<IdentifierNode, Node>, primary: IdentifierNode | null = null) {
    return Object.freeze(new RecordNode(map, primary));
  }

  public static isRecordNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}