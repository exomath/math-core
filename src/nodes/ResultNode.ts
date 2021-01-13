import { Node } from '.';
import { hasType, isObject } from '..';

const TYPE = 'ResultNode';

interface IInternal {
  result: object | null;
}

export class ResultNode extends Node {
  private readonly internal: IInternal = {
    result: null
  };

  private constructor() {
    super(TYPE);

    Object.defineProperty(this, 'result', {
      get: () => { return this.internal.result; },
      enumerable: true
    });
  }

  public reset() {
    this.internal.result = null;
  }

  public update(result: object) {
    if (!isObject(result)) {
      throw new TypeError(`${TYPE}: "result" must be of type object`);
    }

    this.internal.result = result;
  }

  public static new() {
    return Object.freeze(new ResultNode());
  }

  public static isResultNode(value: any): boolean {
    return hasType(value, TYPE);
  }
}