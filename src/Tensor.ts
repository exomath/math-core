import {
  assert,
  hasType,
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

interface IMemoryBlock {
  byteOffset: number;
  byteLength: number;
}

class TensorMemoryBlock implements IMemoryBlock {
  public constructor(
    public readonly byteOffset: number,
    public readonly byteLength: number,
    public readonly dtype: string,
    public readonly view: TensorArrayValues
  ) {
    Object.freeze(this);
  }
}

class FreeMemoryBlock implements IMemoryBlock {
  public constructor(
    public byteOffset: number,
    public byteLength: number
  ) {}
}

interface ITensorMemoryHeap {
  readonly buffer: ArrayBuffer;
  grow?: (delta: number) => number;
}

const HEAP_PAGE_DELTA = 10;

const messenger = 'Tensor';

class TensorMemory {
  private heap: ITensorMemoryHeap;
  private freeBlocks: Map<number, FreeMemoryBlock> = new Map();
  public tensorBlocks: Map<TensorId, TensorMemoryBlock> = new Map();

  public constructor(initial?: ArrayBuffer | ITensorMemoryHeap) {
    if (initial === undefined) {
      this.heap = new WebAssembly.Memory({ initial: HEAP_PAGE_DELTA });
    } else if (initial instanceof ArrayBuffer) {
      this.heap = { buffer: initial };
    } else {
      this.heap = initial;
    }

    this.free(0, this.heap.buffer.byteLength);
  }

  private allocate(byteLength: number): number {
    let block = this.firstFit(byteLength);
    
    if (isNull(block)) {
      assert(
        this.heap.grow !== undefined,
        `The heap does not have ${byteLength} byte${byteLength === 1 ? '' : 's'} to allocate and is not growable`,
        messenger + 'Memory.allocate'
      );

      const newByteOffset = this.heap.buffer.byteLength;

      (this.heap.grow as (delta: number) => number)(HEAP_PAGE_DELTA);

      const newByteLength = this.heap.buffer.byteLength - newByteOffset;

      block = this.free(newByteOffset, newByteLength);

      assert(
        byteLength <= block.byteLength,
        `A single tensor of ${byteLength} bytes cannot be allocated from the heap; the maximum size is ${block.byteLength} bytes`,
        messenger + 'Memory.allocate'
      );
    }

    const byteOffset = block.byteOffset;

    this.freeBlocks.delete(byteOffset);

    if (block.byteLength > byteLength) {
      block.byteOffset = block.byteOffset + byteLength;
      block.byteLength = block.byteLength - byteLength;

      this.freeBlocks.set(block.byteOffset, block);
    }

    return byteOffset;
  }

  public delete(id: TensorId): boolean {
    const block = this.tensorBlocks.get(id);

    if (block === undefined) {
      return false;
    }

    const { byteOffset, byteLength } = block;

    this.free(byteOffset, byteLength);
    this.tensorBlocks.delete(id);

    return true;
  }

  private firstFit(byteLength: number): FreeMemoryBlock | null {
    for (let block of this.freeBlocks.values()) {
      block = this.coalesce(block);

      if (block.byteLength >= byteLength) {
        return block;
      }
    }

    return null;
  }

  private free(byteOffset: number, byteLength: number): FreeMemoryBlock {
    const block = this.coalesce(new FreeMemoryBlock(byteOffset, byteLength));

    this.freeBlocks.set(byteOffset, block);

    return block;
  }

  private coalesce(block: FreeMemoryBlock): FreeMemoryBlock {
    let adjacentBlock = this.freeBlocks.get(block.byteOffset + block.byteLength);

    while (adjacentBlock) {
      this.freeBlocks.delete(adjacentBlock.byteOffset);

      block.byteLength += adjacentBlock.byteLength;

      adjacentBlock = this.freeBlocks.get(block.byteOffset + block.byteLength);
    }

    return block;
  }

  public read(id: TensorId): TensorArrayValues | undefined {
    const block = this.tensorBlocks.get(id);

    return block?.view;
  }

  public write(values: TensorValues, dtype: TensorDataType): TensorId {
    const id: TensorId = {};
    const length = isNumber(values) ? 1 : values.length;
    const byteLength = length * getSize(dtype);
    const byteOffset = this.allocate(byteLength);

    let view: TensorArrayValues;

    switch (dtype) {
      case 'i32':
        view = new Int32Array(this.heap.buffer, byteOffset, length);
      case 'f64':
      default:
        view = new Float64Array(this.heap.buffer, byteOffset, length);
    }

    if (isNumber(values)) {
      view[0] = values;
    } else {
      view.set(values);
    }

    const block = new TensorMemoryBlock(byteOffset, byteLength, dtype, view);

    this.tensorBlocks.set(id, block);

    return id;
  }
}

const TYPE = 'Tensor';

export class Tensor {
  private static memory: TensorMemory;

  public readonly type = TYPE;
  public readonly id: TensorId;
  public readonly length: number;
  public readonly strides: number[];
  public readonly rank: number;

  public constructor(
    values: TensorValues,
    public readonly shape: number[],
    public readonly dtype: TensorDataType
  ) {
    // TensorFlow has "this.shape = shape.slice() as ShapeMap[R]"
    this.length = getLength(shape);
    this.strides = getStrides(shape);
    this.rank = getRank(shape);

    if (!Tensor.memory) {
      Tensor.init();
    }

    this.id = Tensor.memory.write(values, dtype);

    Object.freeze(this);
  }

  public dispose() {
    Tensor.memory.delete(this.id);
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
    const view = Tensor.memory.read(this.id);

    if (view === undefined) {
      return undefined;
    }

    if (this.rank === 0) {
      return view[0];
    }

    return view.slice();
  }

  public static fromScalar(value: ScalarLike, dtype?: TensorDataType) {
    assert(
      isNumber(value) || isString(value) || isBoolean(value),
      '"value" must be of type number | string | boolean',
      messenger + '.fromScalar'
    );

    dtype = dtype ?? getDataType(value);

    const shape: number[] = [];

    return new Tensor(value, shape, dtype);
  }

  public static fromArray(values: ArrayLike, shape: number[], dtype?: TensorDataType) {
    assert(
      isNumberArray(values) || isInt32Array(values) || isFloat64Array(values),
      '"values" must be of type number[] | Int32Array | Float64Array', // | Uint8Array | string[]
      messenger + '.fromArray'
    );

    assert(isNumberArray(shape), '"shape" must be of type number[]', messenger + '.fromArray')

    dtype = dtype ?? getDataType(values);

    return new Tensor(
      (isNumberArray(values) ? getTypedArray(values as number[], dtype) : values) as TensorValues,
      shape,
      dtype
    );
  }

  public static init(initial?: ArrayBuffer | ITensorMemoryHeap) {
    Tensor.memory = new TensorMemory(initial);
  }

  public static isTensor(value: any): value is Tensor {
    return value instanceof Tensor || hasType(value, TYPE);
  }

  public static isScalar(value: Tensor): value is Tensor {
    return Tensor.isTensor(value) && value.rank === 0;
  }

  public static isRowVector(value: Tensor): value is Tensor {
    return Tensor.isMatrix(value) && value.shape[0] === 1;
  }

  public static isColumnVector(value: Tensor): value is Tensor {
    return Tensor.isMatrix(value) && value.shape[1] === 1;
  }

  public static isMatrix(value: Tensor): value is Tensor {
    return Tensor.isTensor(value) && value.rank === 2;
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
