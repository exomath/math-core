import { Node, ResultNode, TensorNode } from '.';
import { assert, hasType, isString } from '..';

const TYPE = 'QuantityNode';

export class QuantityNode extends Node {
  private constructor(
    public readonly value: TensorNode | ResultNode,
    public readonly unit: string
  ) {
    super(TYPE);

    assert(
      TensorNode.isTensorNode(value) || ResultNode.isResultNode(value),
      '"value" must be of type TensorNode | ResultNode',
      TYPE
    );

    assert(isString(unit), '"unit" must be of type string', TYPE);
  }

  public static new(value: TensorNode | ResultNode, unit: string) {
    return Object.freeze(new QuantityNode(value, unit));
  }

  public static isQuantityNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}