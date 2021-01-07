import { Node } from './Node';

const validResultTypes = ['object']; // TODO: Update with specific types and check with the .type property

export class ResultNode implements Node {
  public readonly class = 'ResultNode';
  private _result: object | null = null;

  constructor() {}

  public get result(): object | null {
    return this._result;
  }

  public reset() {
    this._result = null;
  }

  public update(result: object) {
    if (!validResultTypes.includes(typeof result)) {
      throw new TypeError(`ResultNode: "result" cannot be of type "${typeof result}", must be "${validResultTypes.join('"|"')}"`);
    }

    this._result = result;
  }

  public static new() {
    return Object.freeze(new ResultNode());
  }
}