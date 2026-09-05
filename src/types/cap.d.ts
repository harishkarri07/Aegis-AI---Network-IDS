/**
 * Type declarations for optional native packet capture library 'cap'
 */
declare module 'cap' {
  export class Cap {
    static findDevice(ip?: string): string;
    static deviceList(): Array<{
      name: string;
      addresses: Array<{
        addr: string;
        netmask: string;
        broadaddr?: string;
        dstaddr?: string;
      }>;
      description?: string;
      flags?: string;
    }>;

    open(
      device: string,
      filter: string,
      bufSize: number,
      buffer: Buffer
    ): string;

    close(): void;
    setMinBytes(nbytes: number): void;
    on(event: 'packet', listener: (nbytes: number, trunc: boolean) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
  }
}
