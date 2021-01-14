import { TensorHandle, TensorRecord } from '.';

export class TensorRegistry extends WeakMap<TensorHandle, TensorRecord> {
  private constructor() {
    super();
  }

  public static new() {
    return new TensorRegistry();
  }
}