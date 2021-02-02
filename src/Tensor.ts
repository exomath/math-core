import {
  assert,
  ILinkedListNode,
  LinkedList,
  isArray,
  isBoolean,
  isNull,
  isNumber,
  isNumberArray,
  isString,
  isInt32Array,
  isFloat64Array,
  isTypedArray
} from '@exomath/core';

/* Do we need this?
type Tensor0D = Tensor<Rank.R0>;
type Tensor1D = Tensor<Rank.R1>;
type Tensor2D = Tensor<Rank.R2>;
type Tensor3D = Tensor<Rank.R3>;
type Tensor4D = Tensor<Rank.R4>;
type Tensor5D = Tensor<Rank.R5>;
type Tensor6D = Tensor<Rank.R6>;

type Scalar = Tensor0D;
type Vector = Tensor1D;
type Matrix = Tensor2D;

interface RecursiveArray <T extends any> {
  [index: number]: T | RecursiveArray<T>;
}
*/

type TypedArray = Int32Array | Float64Array; // | Uint8Array
type ScalarLike = number; // | string | boolean; // TensorFlow has "| Uint8Array"
type ArrayLike = number[] | TypedArray // | Uint8Array[] | RecursiveArray<number | number[] | TypedArray> | RecursiveArray<boolean> | RecursiveArray<string>;

interface TensorDataTypes {
  i32: Int32Array;
  f64: Float64Array;
  // bool: Uint8Array;
  // str: string[]; // or Uint8Array[]?
}

// export type KernelDataValues = Int32Array | Float64Array | Uint8Array | Uint8Array[]; // Do we need this?
type TensorDataType = keyof TensorDataTypes;
type TensorArrayValues = TensorDataTypes[TensorDataType];
type TensorValues = TensorArrayValues | ScalarLike;
type TensorId = {};

class TensorRecord {
  private constructor(
    public readonly byteOffset: number,
    public readonly byteLength: number,
    public readonly dtype: string,
    public readonly view: TensorArrayValues
  ) {}

  public static new(
    byteOffset: number,
    byteLength: number,
    dtype: string,
    view: TensorArrayValues
  ) {
    return new TensorRecord(byteOffset, byteLength, dtype, view);
  }
}

class TensorRegistry extends WeakMap<TensorId, TensorRecord> {
  private constructor() {
    super();
  }

  public static new() {
    return new TensorRegistry();
  }
}

class FreeMemoryBlock implements ILinkedListNode<FreeMemoryBlock> {
  public prev: FreeMemoryBlock | null = null;
  public next: FreeMemoryBlock | null = null;

  private constructor(
    public byteOffset: number,
    public byteLength: number
  ) {}

  public static new(byteOffset: number, byteLength: number) {
    return new FreeMemoryBlock(byteOffset, byteLength);
  }
}

let messenger = 'TensorMemory';

class TensorMemory extends LinkedList<FreeMemoryBlock> {
  private allocated: Map<number, number> = new Map();

  private constructor(
    private heap: WebAssembly.Memory = new WebAssembly.Memory({ initial: 1 })
  ) {
    super(FreeMemoryBlock.new(0, heap.buffer.byteLength));
  }

  public allocate(byteLength: number): number {
    let block = this.firstFit(byteLength);
    
    if (isNull(block) || block === this.head && block.byteLength === byteLength) {
      const head = this.head as FreeMemoryBlock;

      try {
        while (head.byteLength < byteLength) {
          this.heap.grow(1);

          head.byteLength = this.heap.buffer.byteLength - head.byteOffset;
        }
      } catch (error) {
        // RangeError: WebAssembly.Memory.grow(): Maximum memory size exceeded
      }

      block = head;
    }

    const byteOffset = block.byteOffset;

    if (block.byteLength === byteLength) {
      this.remove(block);
    } else {
      block.byteOffset = block.byteOffset + byteLength;
      block.byteLength = block.byteLength - block.byteOffset;
    }

    this.allocated.set(byteOffset, byteLength);

    return byteOffset;
  }

  private firstFit(byteLength: number): FreeMemoryBlock | null {
    let block: FreeMemoryBlock | null = this.head as FreeMemoryBlock;

    while (!isNull(block)) {
      if (block.byteLength < byteLength) {
        block = block.next;
      } else {
        break;
      }
    }

    return block;
  }

  public free(byteOffset: number) {
    assert(
      this.allocated.has(byteOffset),
      `"byteOffset" ${byteOffset} is not allocated`,
      messenger + '.free'
    );

    const byteLength = this.allocated.get(byteOffset) as number;

    this.insert(FreeMemoryBlock.new(byteOffset, byteLength), this.head); // To do: Try to merge consecutive blocks if present

    this.allocated.delete(byteOffset);
  }

  public view(byteOffset: number): Uint8Array {
    assert(
      this.allocated.has(byteOffset),
      `"byteOffset" ${byteOffset} is not allocated`,
      messenger + '.buffer'
    );

    const byteLength = this.allocated.get(byteOffset) as number;

    return new Uint8Array(this.heap.buffer, byteOffset, byteLength);
  }

  public static new() {
    return new TensorMemory();
  }
}

let _registry = TensorRegistry.new();
let _memory = TensorMemory.new();

const TYPE = messenger = 'Tensor';

export class Tensor {
  public readonly type = TYPE;
  public readonly id: TensorId;
  public readonly length: number;
  public readonly strides: number[];
  public readonly rank: number;

  private constructor(
    values: TensorValues,
    public readonly shape: number[],
    public readonly dtype: TensorDataType
  ) {
    // TensorFlow has "this.shape = shape.slice() as ShapeMap[R]"
    this.length = getLength(shape);
    this.strides = getStrides(shape);
    this.rank = getRank(shape);
    this.id = Tensor.write(values, dtype);
  }

  public dispose() {
    Tensor.delete(this.id);
  }

  public index(index: number[]): number | undefined {
    assert(
      this.strides.length === index.length,
      '"strides" and "index" must be the same length',
      messenger + '.index'
    );

    const values = this.values();

    if (values === undefined) {
      return undefined;
    }

    if (isNumber(values)) {
      return values;
    }

    let offset = 0;
    
    for (let i = 0; i < this.strides.length; ++i) {
      offset += index[i] * this.strides[i];
    }

    return values[offset];
  }

  public values(): TensorValues | undefined {
    const view = Tensor.read(this.id);

    if (view === undefined) {
      return undefined;
    }

    if (this.rank === 0) {
      return view[0];
    }

    return view.slice();
  }

  private static new(values: TensorValues, shape: number[], dtype: TensorDataType) {
    return Object.freeze(new Tensor(values, shape, dtype));
  }

  public static fromScalar(value: ScalarLike, dtype?: TensorDataType) {
    assert(
      isNumber(value) || isString(value) || isBoolean(value),
      '"value" must be of type number | string | boolean',
      messenger + '.fromScalar'
    );

    dtype = dtype ?? getDataType(value);

    const shape: number[] = [];

    return Tensor.new(value, shape, dtype);
  }

  public static fromArray(values: ArrayLike, shape: number[], dtype?: TensorDataType) {
    assert(
      isNumberArray(values) || isInt32Array(values) || isFloat64Array(values),
      '"values" must be of type number[] | Int32Array | Float64Array', // | Uint8Array | string[]
      messenger + '.fromArray'
    );

    assert(isNumberArray(shape), '"shape" must be of type number[]', messenger + '.fromArray')

    dtype = dtype ?? getDataType(values);

    return Tensor.new(
      (isNumberArray(values) ? getTypedArray(values as number[], dtype) : values) as TensorValues,
      shape,
      dtype
    );
  }

  private static delete(id: TensorId): boolean {
    const record = _registry.get(id);

    if (record === undefined) {
      return false;
    }

    _memory.free(record.byteOffset);
    _registry.delete(id);

    return true;
  }

  private static read(id: TensorId): TensorArrayValues | undefined {
    const record = _registry.get(id);

    return record?.view;
  }

  private static write(values: TensorValues, dtype: TensorDataType): TensorId {
    const id: TensorId = {};

    const length = isNumber(values) ? 1 : values.length;

    const byteLength = length * getSize(dtype);
    const byteOffset = _memory.allocate(byteLength);
    const rawView = _memory.view(byteOffset);

    assert(
      rawView.byteLength === byteLength,
      `"rawView.byteLength" ${rawView.byteLength} !== tensor byteLength ${byteLength}`,
      messenger + '.read'
    );

    let view: TensorArrayValues;

    switch (dtype) {
      case 'i32':
        view = new Int32Array(rawView.buffer, byteOffset, length);
      case 'f64':
      default:
        view = new Float64Array(rawView.buffer, byteOffset, length);
    }

    if (isNumber(values)) {
      view[0] = values;
    } else {
      view.set(values);
    }

    const record = TensorRecord.new(byteOffset, byteLength, dtype, view);

    _registry.set(id, record);

    return id;
  }

  // For debugging only
  
  private static memory(): TensorMemory {
    return _memory;
  }

  private static registry(): TensorRegistry {
    return _registry;
  }

  private static reset() {
    _registry = TensorRegistry.new();
    _memory = TensorMemory.new();
  }
}

function getDataType(values: TensorValues | number[]): TensorDataType {
  if (isArray(values) || isTypedArray(values)) {
    return getDataType((values as ArrayLike)[0]);
  }

  if (isFloat64Array(values)) {
    return 'f64';
  } else if (isInt32Array(values)) { // || values instanceof Uint8Array
    return 'i32';
  } else if (isNumber(values)) {
    return 'f64';
  }/* else if (isString(value)) {
    return 'str';
  } else if (isBoolean(value)) {
    return 'bool';
  }*/ else {
    return 'f64';
  }
}

function getLength(shape: number[]): number {
  return shape.length === 0 ? 1 : shape.reduce((length, next) => length * next);
}

function getRank(shape: number[]): number {
  return shape.length;
}

function getSize(dtype: TensorDataType): number {
  switch (dtype) {
    case 'i32':
      return 4;
    case 'f64':
    default:
      return 8;
  }
}

function getStrides(shape: number[]): number[] {
  const rank = getRank(shape);

  switch (rank) {
    case 0:
      return [];
    case 1:
      return [1];
    default:
      const strides = new Array(rank);

      strides[rank - 1] = 1;
      strides[rank - 2] = shape[rank - 1];

      for (let i = rank - 3; i >= 0; --i) {
        strides[i] = strides[i + 1] * shape[i + 1];
      }

      return strides;
  }
}

function getTypedArray(values: number[], dtype: TensorDataType): TypedArray {
  const messenger = 'getTypedArray';

  assert(isNumberArray(values), '"values" must be of type number[]', messenger);
  assert(dtype === 'i32' || dtype === 'f64', '"value" must be "i32" | "f64"', messenger);

  switch (dtype) {
    case 'i32':
      return new Int32Array(values);
    case 'f64':
    default:
      return new Float64Array(values);
  }
}

/* Do we need this?
function assertDeepShapeConsistency(value: TensorLike, shape: number[], indices: number[]): void {
  indices = indices ?? [];

  if (!(isArray(value)) && !isTypedArray(value)) {
    assert(shape.length === 0, () => {
      return `Element [${indices.join('][')}] is a primitive, but should be an Array | TypedArray of ${shape[0]} elements`;
    });

    return;
  }

  assert(shape.length > 0, () => {
    return `Element [${indices.join('][')}] should be a primitive, but is an Array of ${(value as unknown[]).length} elements`;
  });

  assert((value as unknown[]).length === shape[0], () => {
    return `Element [${indices.join('][')}] should have ${shape[0]} elements, but has ${(value as Array<any>).length} elements`;
  });

  const subShape = shape.slice(1);

  for (let i = 0; i < (value as unknown[]).length; ++i) {
    assertDeepShapeConsistency((value as Array<any>)[i], subShape, indices.concat(i));
  }
}

function assertNonNegativeIntegerDimensions(shape: number[]): void {
  shape.forEach((dimSize) => {
    assert(isInteger(dimSize) && dimSize >= 0, () => {
      return `Tensor must have a shape comprised of positive integers but got shape [${shape}]`;
    });
  });
}

function flatten<T extends number | boolean | string | Promise<number> | TypedArray>(
  array: T | RecursiveArray<T>, result: T[] = [], skipTypedArray = false
): T[] {
  if (result == null) {
    result = [];
  }

  if (isArray(array) || isTypedArray(array) && !skipTypedArray) {
    for (let i = 0; i < (array as Array<any>).length; ++i) {
      flatten((array as Array<any>)[i], result, skipTypedArray);
    }
  } else {
    result.push(array as T);
  }

  return result;
}

function inferShape (value: TensorLike, dtype?: DataType): number[] {
  let firstElem: typeof value = value;

  if (isTypedArray(value)) {
    return dtype === 'str'
      ? []
      : [(value as TypedArray).length];
  }

  if (!isArray(value)) {
    return []; // scalar
  }

  const shape: number[] = [];

  while (isArray(firstElem) || isTypedArray(firstElem) && dtype !== 'str') {
    shape.push((firstElem as Array<any>).length);

    firstElem = (firstElem as Array<any>)[0];
  }

  if (isArray(value)) { // && env().getBool('TENSORLIKE_CHECK_SHAPE_CONSISTENCY')
    assertDeepShapeConsistency(value, shape, []);
  }

  return shape;
}
*/
