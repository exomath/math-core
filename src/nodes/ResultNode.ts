import { Node } from './Node';

interface Internal {
  result: object | null;
}

const validResultTypes = ['object']; // TODO: Update with specific types and check with the .type property

export class ResultNode implements Node {
  public readonly class = 'ResultNode';
  private readonly internal: Internal = {
    result: null
  };

  constructor() {
    Object.defineProperty(this, 'result', {
      get() { return this.internal.result; },
      enumerable: true
    });
  }

  public reset() {
    this.internal.result = null;
  }

  public update(result: object) {
    if (!validResultTypes.includes(typeof result)) {
      throw new TypeError(`ResultNode: "result" cannot be of type "${typeof result}", must be "${validResultTypes.join('" | "')}"`);
    }

    this.internal.result = result;
  }

  public static new() {
    return Object.freeze(new ResultNode());
  }
}