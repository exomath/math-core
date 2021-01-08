import {
  Node,
  ResultContainer
} from './';

export class EvaluationNode implements Node {
  public readonly class = 'EvaluationNode';

  constructor(
    public readonly expression: Node,
    public readonly result: ResultContainer
  ) {
    if (!(typeof expression === 'object' && expression.hasOwnProperty('class') && expression.class.endsWith('Node'))) {
      throw new TypeError('EvaluationNode: "expression" must be of class "Node"');
    }

    if (!(typeof result === 'object' && result.containsResult)) {
      throw new TypeError('EvaluationNode: "result" must be a ResultContainer');
    }
  }

  public static new(expression: Node, result: ResultContainer) {
    return Object.freeze(new EvaluationNode(expression, result));
  }
}