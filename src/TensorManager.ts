import { assert } from '@exomath/core';

import {
  TensorValues, TensorDType, TensorHandle,
  TensorRecord, TensorRegistry
} from './index';

export interface TensorAccessor {
  get: () => number;
  set: (value: number) => void;
}

const TYPE = 'TensorManager';
const MEMORY_INITIAL_SIZE = 1;

export class TensorManager {
  private registry: TensorRegistry = TensorRegistry.new();
  private memory: WebAssembly.Memory = new WebAssembly.Memory({ initial: MEMORY_INITIAL_SIZE });

  private constructor() {}

  public allocate(values: TensorValues, dtype: TensorDType): TensorHandle {
    const handle: TensorHandle = {};
    const { offset, length, view } = allocateMemory(this.memory, values, dtype);
    const record = TensorRecord.new(offset, length, dtype, view);

    this.registry.set(handle, record);

    return handle;
  }

  public index(handle: TensorHandle, strides: number[], index: number[]): TensorAccessor {
    const messenger = TYPE + '.index';

    assert(this.registry.has(handle), '"handle" is not managed by this tensor manager', messenger);
    assert(strides.length === index.length, '"strides" and "index" must be the same length', messenger);

    const record = this.registry.get(handle) as TensorRecord;

    let offset = 0;
    
    for (let i = 0; i < strides.length; ++i) {
      offset += index[i] * strides[i];
    }

    return {
      get: () => {
        return record.view[offset];
      },
      set: (value: number) => {
        record.view[offset] = value;
      }
    };
  }

  public read(handle: TensorHandle): TensorValues {
    assert(this.registry.has(handle), '"handle" is not managed by this tensor manager', TYPE + '.read');

    const record = this.registry.get(handle) as TensorRecord;

    return record.view;
  }

  public static new() {
    return new TensorManager();
  }
}

// Replace with real implementation
function allocateMemory(memory: WebAssembly.Memory, values: TensorValues, dtype: TensorDType) {
  return {
    offset: 0,
    length: 0,
    view: new Float64Array()
  };
}
