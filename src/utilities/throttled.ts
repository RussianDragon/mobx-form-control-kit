const defaultIndex = -1;
export class Throttled<TEntity> {
  private loopIndex: number = defaultIndex;
  private lastReqest: (() => Promise<TEntity>) | undefined;
  public invoke = async (
    method: () => Promise<TEntity>,
    wait: number = 0,
    resolve: (data: TEntity) => void = () => {},
    reject: (data: unknown) => void = () => {}
  ): Promise<void> => {
    this.loopIndex++;
    this.lastReqest = method;
    if (this.loopIndex !== defaultIndex + 1) {
      return;
    }
    do {
      const specificLoopIndex = this.loopIndex;
      try {
        const data = await this.lastReqest();
        if (this.loopIndex === specificLoopIndex) {
          resolve(data);
          break;
        }
      } catch (ex) {
        if (this.loopIndex === specificLoopIndex) {
          reject(ex);
          break;
        }
      }
      if (0 < wait) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, wait));
      }
    } while (true);
    this.loopIndex = defaultIndex;
  };
}
