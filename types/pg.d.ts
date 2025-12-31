declare module "pg" {
  export interface PoolConfig {
    connectionString?: string
    [key: string]: any
  }

  export class Pool {
    constructor(config?: PoolConfig)
    connect: () => Promise<any>
    end: () => Promise<void>
    query: (...args: any[]) => Promise<any>
  }
}
