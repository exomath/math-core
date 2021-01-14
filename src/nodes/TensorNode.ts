import { Node } from '.';
import { assert, hasType, isIntegerArray } from '..';

const TYPE = 'TensorNode';

export class TensorNode extends Node {
  private constructor(
    public readonly values: Node[],
    public readonly shape: number[]
  ) {
    super(TYPE);

    assert(Node.isNodeArray(values), '"data" must be of type *Node[]', TYPE);
    assert(isIntegerArray(shape), '"shape" must be of type number[], with each item an integer', TYPE);
  }

  public static new(values: Node[], shape: number[]) {
    return Object.freeze(new TensorNode(values, shape));
  }

  public static isTensorNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}