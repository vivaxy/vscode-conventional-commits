export class CommitStore {
  private _data: Data[] = [];
  private static INSTANCE: CommitStore;

  static initialize() {
    if (!this.INSTANCE) {
      this.INSTANCE = new CommitStore();
    }
    return this.INSTANCE;
  }

  store(name: string, value: any = null): void {
    const find = this._data.findIndex((x) => x.name === name);
    if (find !== -1) {
      this._data[find].value = value;
    } else {
      this._data.push({ name, value });
    }
  }

  get(name: string): any {
    const result = this._data.filter((e: Data) => e.name === name);
    if (!result || !result[0].value || result[0].value === 'None') {
      return '';
    }
    return result[0].value;
  }
}

type Data = {
  name: string;
  value: any;
};
