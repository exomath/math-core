import { TensorValues, TensorDType, TensorHandle, TensorRecord, TensorRegistry } from '.';
import { assert } from '..';

export type TensorView = Int32Array | Float64Array;

const TYPE = 'TensorManager';
const MEMORY_INITIAL_SIZE = 1;

export class TensorManager {
  private registry: TensorRegistry = TensorRegistry.new();
  private memory: WebAssembly.Memory = new WebAssembly.Memory({ initial: MEMORY_INITIAL_SIZE });

  private constructor() {}

  public allocate(values: TensorValues, dtype: TensorDType): TensorHandle {
    const handle: TensorHandle = {};
    const { offset, length, view } = allocateMemory(values, dtype);
    const record = TensorRecord.new(offset, length, dtype, view);

    this.registry.set(handle, record);

    return handle;
  }

  public read(handle: TensorHandle): TensorValues {
    assert(this.registry.has(handle), '"handle" is not managed by this tensor manager', TYPE + '.read()');

    const record = this.registry.get(handle) as TensorRecord;

    return record.view;
  }

  public view(handle: TensorHandle): TensorValues {
    assert(this.registry.has(handle), '"handle" is not managed by this tensor manager', TYPE + '.view()');

    const record = this.registry.get(handle) as TensorRecord;

    return record.view;
  }

  public static new() {
    return new TensorManager();
  }
}

// Replace with real implementation
function allocateMemory(values: TensorValues, dtype: TensorDType) {
  return {
    offset: 0,
    length: 0,
    view: new Float64Array()
  };
}