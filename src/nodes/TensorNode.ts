import { Node } from '.';
import { hasType, isIntegerArray } from '../utils';

const TYPE = 'TensorNode';

export class TensorNode extends Node {
  public constructor(
    public readonly data: Node[],
    public readonly shape: number[]
  ) {
    super(TYPE);

    if (!Node.isNodeArray(data)) {
      throw new TypeError(`${TYPE}: "data" must be of type *Node[]`);
    }

    if (!isIntegerArray(shape)) {
      throw new TypeError(`${TYPE}: "shape" must be of type number[], with each item an integer`);
    }
  }

  public static new(data: Node[], shape: number[]) {
    return Object.freeze(new TensorNode(data, shape));
  }

  public static isTensorNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}