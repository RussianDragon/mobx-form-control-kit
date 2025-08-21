// const defaultIndex = -1;
// export class Throttled<TEntity> {
//   private loopIndex: number = defaultIndex;
//   private lastReqest: (() => Promise<TEntity>) | undefined;
//   public invoke = async (
//     method: () => Promise<TEntity>,
//     wait: number = 0,
//     resolve: (data: TEntity) => void = () => {},
//     reject: (data: unknown) => void = () => {}
//   ): Promise<void> => {
//     this.loopIndex++;
//     this.lastReqest = method;
//     if (this.loopIndex !== defaultIndex + 1) {
//       return;
//     }
//     do {
//       const specificLoopIndex = this.loopIndex;
//       try {
//         const data = await this.lastReqest();
//         if (this.loopIndex === specificLoopIndex) {
//           resolve(data);
//           break;
//         }
//       } catch (ex) {
//         if (this.loopIndex === specificLoopIndex) {
//           reject(ex);
//           break;
//         }
//       }
//       if (0 < wait) {
//         await new Promise((resolveDelay) => setTimeout(resolveDelay, wait));
//       }
//     } while (true);
//     this.loopIndex = defaultIndex;
//   };
// }

export class Throttled<TEntity> {
  private queue: (() => Promise<TEntity>)[] = [];
  public invoke = async (
    method: () => Promise<TEntity>,
    wait = 0,
    resolve: (data: TEntity) => void = () => {
      /*empty*/
    },
    reject: (data: unknown) => void = () => {
      /*empty*/
    },
  ): Promise<void> => {
    do {
      this.queue.push(method);
      if (this.queue.length > 1) {
        return;
      }
      try {
        this.queue = this.queue.slice(-1);
        const data = await this.queue.pop()!();
        if (this.queue.length == 0) {
          resolve(data);
          break;
        }
      } catch (ex) {
        if (this.queue.length == 0) {
          reject(ex);
          break;
        }
      }
      if (0 < wait) {
        await new Promise(resolveDelay => setTimeout(resolveDelay, wait));
      }
    } while (this.queue.length);
  };
}
