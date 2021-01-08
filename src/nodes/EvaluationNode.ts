import { Node, ResultContainer, ResultNode } from './';
import { hasOwnProperty, hasType } from '../utils';

const TYPE = 'EvaluationNode';

export class EvaluationNode extends Node {
  public constructor(
    public readonly expression: Node,
    public readonly result: ResultContainer | ResultNode
  ) {
    super(TYPE);

    if (!Node.isNode(expression)) {
      throw new TypeError(`${TYPE}: "expression" must be of type *Node`);
    }

    if (!(hasOwnProperty(result, 'containsResult') || ResultNode.isResultNode(result))) {
      throw new TypeError(`${TYPE}: "result" must be a ResultContainer or of type ResultNode`);
    }
  }

  public static new(expression: Node, result: ResultContainer | ResultNode) {
    return Object.freeze(new EvaluationNode(expression, result));
  }

  public static isEvaluationNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}