import { DataType, KernelDataValues, TensorHandle } from './Tensor'

export type KernelFactory = { create: () => Kernel }

export interface DataMover {
  /**
   * To be called by kernels whenever they see a handle they don't own.
   * Upon calling this method, the mover will fetch the tensor from another
   * kernel and register it with the current active kernel.
   */
  moveData (kernel: Kernel, handle: TensorHandle): void
}

export class DataStorage<T> {
  private data = new WeakMap<TensorHandle, T>()
  private handlesCount = 0

  constructor (private kernel: Kernel, private dataMover: DataMover) {}

  public get (handle: TensorHandle): T {
    if (!this.data.has(handle)) {
      this.dataMover.moveData(this.kernel, handle)
    }

    return this.data.get(handle) as T
  }

  public set (handle: TensorHandle, value: T): void {
    this.handlesCount++
    this.data.set(handle, value)
  }

  public has (handle: TensorHandle): boolean {
    return this.data.has(handle)
  }

  public delete (handle: TensorHandle): boolean {
    this.handlesCount--

    return this.data.delete(handle)
  }

  public numHandles (): number {
    return this.handlesCount
  }
}

export abstract class Kernel {
  public abstract name: string

  // Tensor storage methods

  public abstract dispose (): void

  public abstract disposeData (handle: TensorHandle): void

  public abstract move (handle: TensorHandle, values: KernelDataValues, shape: number[], dtype: DataType): void

  public abstract numHandles (): number

  public abstract read (handle: TensorHandle): Promise<KernelDataValues>

  public abstract readSync (handle: TensorHandle): KernelDataValues

  public abstract write (values: KernelDataValues, shape: number[], dtype: DataType): TensorHandle

  public abstract memory (): { unreliable: boolean, reasons?: string[] }

  // Mathematical methods
}

function notYetImplemented(fn: string): never {
  throw new Error(`'${fn}' not yet implemented or not found. Import an engine kernel that supports '${fn}'`)
}
