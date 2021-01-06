import { DataType, DataValues, KernelDataValues, TensorHandle } from './Tensor';
import { Kernel, KernelFactory, DataMover } from './Kernel';
import { encodeString, isString } from './utils';

export class Engine implements DataMover {
  public kernel!: Kernel;
  public kernels = new Map<string, KernelFactory>();

  constructor (kernels: { name: string, factory: KernelFactory }[]) {
    kernels.forEach(kernel => this.addKernel(kernel.name, kernel.factory));

    this.setKernel(kernels[0].name);
  }

  addKernel (name: string, factory: KernelFactory): boolean {
    if (this.kernels.has(name)) {
      console.warn(`Kernel '${name}' is already added. To replace, remove first`);

      return false;
    } else {
      this.kernels.set(name, factory);

      return true;
    }
  }

  allocateTensor (values: DataValues, shape: number[], dtype: DataType): TensorHandle {
    let kernelValues = values as KernelDataValues;

    if (dtype === 'str' && isString(values[0])) {
      kernelValues = (values as string[]).map(d => encodeString(d));
    }
    
    const handle = this.kernel.write(kernelValues, shape, dtype);
    // this.incRef(t, kernel);

    /*
    // Count bytes for string tensors.
    if (dtype === 'str') {
      const info = this.state.tensorInfo.get(dataId);
      const newBytes = bytesFromStringArray(kernelValues as Uint8Array[]);
      this.state.numBytes += newBytes - info.bytes;
      info.bytes = newBytes;
    }
    */

    return handle;
  }

  removeKernel (name: string): boolean {
    return this.kernels.delete(name);
  }

  setKernel (name: string): boolean {
    if (this.kernels.has(name)) {
      this.kernel = (this.kernels.get(name) as KernelFactory).create();

      return true;
    } else {
      return false;
    }
  }
}
