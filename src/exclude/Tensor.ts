import { Engine } from './Engine';
import { assert, isArray, isBoolean, isInteger, isNumber, isString } from './utils';

interface ShapeMap {
  R0: number[]; // Should this be just []?
  R1: [number];
  R2: [number, number];
  R3: [number, number, number];
  R4: [number, number, number, number];
  R5: [number, number, number, number, number];
  R6: [number, number, number, number, number, number];
}

interface DataTypeMap {
  i32: Int32Array;
  f64: Float64Array;
  bool: Uint8Array;
  str: string[];
}

export type KernelDataValues = Int32Array | Float64Array | Uint8Array | Uint8Array[];
export type DataType = keyof DataTypeMap;
export type DataValues = DataTypeMap[DataType];

enum Rank {
  R0 = 'R0', // scalar
  R1 = 'R1', // vector
  R2 = 'R2', // matrix
  R3 = 'R3',
  R4 = 'R4',
  R5 = 'R5',
  R6 = 'R6'
}

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

type TypedArray = Int32Array | Float64Array | Uint8Array;

interface RecursiveArray <T extends any> {
  [index: number]: T | RecursiveArray<T>;
}

type ScalarLike = number | boolean | string | Uint8Array;
type TensorLike = ScalarLike | TypedArray | Uint8Array[]
                | RecursiveArray<number | number[] | TypedArray>
                | RecursiveArray<boolean>
                | RecursiveArray<string>;

let ENGINE: Engine | null = null;

export type TensorHandle = object;

export class Tensor <R extends Rank = Rank> {
  public readonly shape: ShapeMap[R];
  public readonly dtype: DataType;
  public readonly handle: TensorHandle;
  public readonly size: number;
  public readonly strides: number[];
  public readonly rank: number;

  constructor (values: DataValues, shape: ShapeMap[R], dtype: DataType) {
    assert(ENGINE !== null, () => {
      return 'Error in new Tensor: No engine set. Call Tensor.setEngine(engine) first.';
    });

    assert(isTypedArray(values) || (isArray(values) && isString(values[0])), () => {
      return 'Error in new Tensor: Value(s) must be Float64Array | Int32Array | Uint8Array | string[]';
    });

    this.shape = shape.slice() as ShapeMap[R];
    this.dtype = dtype || 'f64';
    this.size = getSize(shape);
    this.strides = getStrides(shape);
    this.rank = shape.length;
    this.handle = (ENGINE as Engine).allocateTensor(values, shape, dtype);
  }

  static setEngine (engine: Engine): void {
    ENGINE = engine;
  }

  static new (values: TensorLike, shape: number[], dtype?: DataType): Tensor {
    if (dtype == null) {
      dtype = inferDtype(values);
    }

    /*
    if (dtype === 'complex64') {
      throw new Error(`Cannot construct a complex64 tensor directly. Use Tensor.complex(real, imag).`);
    }
    */

    assert(isTypedArray(values) || isArray(values) || isNumber(values) || isBoolean(values) || isString(values), () => {
      return 'Error in Tensor.new: Value(s) must be number | boolean | string | Array<numbers | booleans | string> | TypedArray';
    });

    const inferredShape = inferShape(values, dtype);

    if (shape != null) {
      assertNonNegativeIntegerDimensions(shape);

      const providedSize = getSize(shape);
      const inferredSize = getSize(inferredShape);

      assert(providedSize === inferredSize, () => {
        return `Error in Tensor.new: Based on provided shape [${shape}], tensor should have ${providedSize} value(s) but has ${inferredSize}`;
      });

      for (let i = 0; i < inferredShape.length; ++i) {
        const inferred = inferredShape[i];
        const flatDimsDontMatch = i === inferredShape.length - 1
          ? inferred !== getSize(shape.slice(i))
          : true;
        
        assert(inferredShape[i] === shape[i] || !flatDimsDontMatch, () => {
          return `Error in Tensor.new: Inferred shape [${inferredShape}] does not match provided shape [${shape}]`;
        });
      }
    }

    if (!(isTypedArray(values) || isArray(values))) {
      values = [values] as number[];
    }

    shape = shape || inferredShape;
    values = dtype !== 'str'
      ? toTypedArray(values, dtype/*, env().getBool('DEBUG')*/)
      : flatten(values as string[], [], true) as string[];

    return Object.freeze(new Tensor(values as DataValues, shape, dtype));
  }

  static scalar (value: ScalarLike, dtype?: DataType): Scalar {
    if (/*(*/(isTypedArray(value) && dtype !== 'str') || isArray(value)/*) && dtype !== 'complex64'*/) {
      throw new Error('Error in Tensor.scalar: Value must be number | boolean | string | Uint8Array (encoded string)');
    }

    if (dtype === 'str' && isTypedArray(value) && !(value instanceof Uint8Array)) {
      throw new Error('Error in Tensor.scalar: If value is an encoded string, it must be a Uint8Array');
    }

    const shape: number[] = [];

    return Tensor.new(value, shape, dtype) as Scalar;
  }

  static tensor <R extends Rank> (values: TensorLike, shape?: ShapeMap[R], dtype?: DataType): Tensor<R> {
    return Tensor.new(values, shape as number[], dtype) as Tensor<R>;
  }
}

function assertDeepShapeConsistency (value: TensorLike, shape: number[], indices: number[]): void {
  indices = indices || [];

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

function assertNonNegativeIntegerDimensions (shape: number[]): void {
  shape.forEach((dimSize) => {
    assert(isInteger(dimSize) && dimSize >= 0, () => {
      return `Tensor must have a shape comprised of positive integers but got shape [${shape}]`;
    });
  });
}

function flatten <T extends number | boolean | string | Promise<number> | TypedArray> (
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

function getSize (shape: number[]): number {
  return shape.length === 0
    ? 1
    : shape.reduce((size, next) => size * next);
}

function getStrides (shape: number[]): number[] {
  const rank = shape.length;

  if (rank < 2) {
    return [];
  }

  // Last dimension has implicit stride of 1, thus having D-1 (instead of D)
  // strides.
  const strides = new Array(rank - 1);
  strides[rank - 2] = shape[rank - 1];

  for (let i = rank - 3; i >= 0; --i) {
    strides[i] = strides[i + 1] * shape[i + 1];
  }

  return strides;
}

function inferDtype (values: TensorLike): DataType {
  if (isArray(values)) {
    return inferDtype((values as Array<any>)[0]);
  }

  if (values instanceof Float64Array) {
    return 'f64';
  } else if (values instanceof Int32Array || values instanceof Uint8Array) {
    return 'i32';
  } else if (isNumber(values)) {
    return 'f64';
  } else if (isString(values)) {
    return 'str';
  } else if (isBoolean(values)) {
    return 'bool';
  }

  return 'f64';
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

  if (isArray(value) /* && env().getBool('TENSORLIKE_CHECK_SHAPE_CONSISTENCY') */) {
    assertDeepShapeConsistency(value, shape, []);
  }

  return shape;
}

function isTypedArray (value: unknown): value is TypedArray {
  return value instanceof Int32Array
      || value instanceof Float64Array
      || value instanceof Uint8Array;
}

function toTypedArray (value: TensorLike, dtype: DataType/*, debugMode: boolean*/): TypedArray {
  assert(dtype !== 'str', () => {
    return 'Cannot convert a string[] to a TypedArray';
  });

  if (isArray(value)) {
    value = flatten(value);
  }

  /*
  if (debugMode) {
    checkConversionForErrors(a as number[], dtype);
  }
  */

  function noConversionNeeded (value: TensorLike, dtype: DataType): boolean {
    return (value instanceof Float64Array && dtype === 'f64')
        || (value instanceof Int32Array && dtype === 'i32')
        || (value instanceof Uint8Array && dtype === 'bool');
  }

  if (noConversionNeeded(value, dtype)) {
    return value as TypedArray;
  }

  if (dtype == null || dtype === 'f64'/* || dtype === 'complex64'*/) {
    return new Float64Array(value as number[]);
  } else if (dtype === 'i32') {
    return new Int32Array(value as number[]);
  } else if (dtype === 'bool') {
    const bool = new Uint8Array((value as number[]).length);

    for (let i = 0; i < bool.length; ++i) {
      if (Math.round((value as number[])[i]) !== 0) {
        bool[i] = 1;
      }
    }

    return bool;
  } else {
    throw new Error(`Unknown data type ${dtype}`);
  }
}
