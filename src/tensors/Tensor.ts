import { TensorManager, TensorView } from '.';
import {
  assert,
  isArray, isBoolean, isNumber, isNumberArray, isString,
  isInt32Array, isFloat64Array, isTypedArray
} from '..';

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
type ScalarLike = number | boolean | string; // TensorFlow has "| Uint8Array"
type ArrayLike = number[] | TypedArray // | Uint8Array[] | RecursiveArray<number | number[] | TypedArray> | RecursiveArray<boolean> | RecursiveArray<string>;

export type TensorShape = number[];

interface DTypeMap {
  i32: Int32Array;
  f64: Float64Array;
  // bool: Uint8Array;
  // str: string[]; // or Uint8Array[]?
}

// export type KernelDataValues = Int32Array | Float64Array | Uint8Array | Uint8Array[]; // Do we need this?
export type TensorDType = keyof DTypeMap;
export type TensorValues = DTypeMap[TensorDType] | ScalarLike;

let _manager: TensorManager | null = null;

export interface TensorHandle {};

type TensorIndex = number[];

interface TensorAccessor {
  get: () => number;
  set: (value: number) => void;
}

const TYPE = 'Tensor';

export class Tensor {
  public readonly handle: TensorHandle;
  public readonly length: number;
  public readonly strides: number[];
  public readonly rank: number;

  private constructor(
    values: TensorValues,
    public readonly shape: TensorShape,
    public readonly dtype: TensorDType
  ) {
    assert(_manager !== null, 'No tensor manager is set; call Tensor.setManager() first', TYPE);

    // TensorFlow has "this.shape = shape.slice() as ShapeMap[R]"
    this.length = getLength(shape);
    this.strides = getStrides(shape);
    this.rank = getRank(shape);
    this.handle = (_manager as TensorManager).allocate(values, dtype);
  }

  public index(index: TensorIndex): TensorAccessor {
    const view: TensorView = (_manager as TensorManager).view(this.handle) as TensorView;
    const viewIndex = 0;

    return {
      get: () => {
        return view[viewIndex];
      },
      set: (value: number) => {
        view[viewIndex] = value;
      }
    };
  }

  public values() {
    return (_manager as TensorManager).read(this.handle);
  }

  public static setManager(manager: TensorManager) {
    _manager = manager;
  }

  public static new(values: TensorValues, shape: TensorShape, dtype: TensorDType) {
    return Object.freeze(new Tensor(values, shape, dtype));
  }

  public static fromScalar(value: ScalarLike, dtype?: TensorDType) {
    const assertMessenger = TYPE + '.fromScalar()';

    assert(
      isNumber(value) || isString(value) || isBoolean(value),
      '"value" must be of type number | string | boolean',
      assertMessenger
    );

    dtype = dtype || getDtype(value);

    const shape: TensorShape = [];

    return Tensor.new(value, shape, dtype);
  }

  public static fromArray(values: ArrayLike, shape: TensorShape, dtype?: TensorDType) {
    const assertMessenger = TYPE + '.fromArray()';

    assert(
      isNumberArray(values) || isInt32Array(values) || isFloat64Array(values),
      '"values" must be of type number[] | Int32Array | Float64Array', // | Uint8Array | string[]
      assertMessenger
    );

    assert(isNumberArray(shape), '"shape" must be of type number[]', assertMessenger)

    dtype = dtype || getDtype(values);

    return Tensor.new(
      (isNumberArray(values) ? getTypedArray(values as number[], dtype) : values) as TensorValues,
      shape,
      dtype
    );
  }
}

function getDtype(value: TensorValues | number[]): TensorDType {
  if (isArray(value) || isTypedArray(value)) {
    return getDtype((value as ArrayLike)[0]);
  }

  if (isFloat64Array(value)) {
    return 'f64';
  } else if (isInt32Array(value)) { // || values instanceof Uint8Array
    return 'i32';
  } else if (isNumber(value)) {
    return 'f64';
  }/* else if (isString(value)) {
    return 'str';
  } else if (isBoolean(value)) {
    return 'bool';
  }*/ else {
    return 'f64';
  }
}

function getLength(shape: TensorShape): number {
  return shape.length === 0 ? 1 : shape.reduce((length, next) => length * next);
}

function getStrides(shape: TensorShape): number[] {
  const rank = getRank(shape);

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

function getRank(shape: TensorShape): number {
  return shape.length;
}

function getTypedArray(value: number[], dtype: TensorDType): TypedArray {
  const assertMessenger = 'getTypedArray()';

  assert(isNumberArray(value), '"value" must be of type number[]', assertMessenger);
  assert(dtype === 'i32' || dtype === 'f64', '"value" must be "i32" | "f64"', assertMessenger);

  switch (dtype) {
    case 'i32':
      return new Int32Array(value);
    case 'f64':
    default:
      return new Float64Array(value);
  }
}

/* Do we need this?
function assertDeepShapeConsistency(value: TensorLike, shape: number[], indices: number[]): void {
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