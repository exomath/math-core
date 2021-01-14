export class TensorRecord {
  private constructor(
    public offset: number,
    public length: number,
    public dtype: string,
    public view: Float64Array
  ) {}

  public static new(offset: number, length: number, dtype: string, view: Float64Array) {
    return new TensorRecord(offset, length, dtype, view);
  }
}