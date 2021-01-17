export type TensorView = Int32Array | Float64Array;

export class TensorRecord {
  private constructor(
    public offset: number,
    public length: number,
    public dtype: string,
    public view: TensorView
  ) {}

  public static new(offset: number, length: number, dtype: string, view: Float64Array) {
    return new TensorRecord(offset, length, dtype, view);
  }
}
