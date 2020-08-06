import { SimpleEventDispatcher } from "strongly-typed-events";

export type TLE = [string, string, string];
export type TLEMap = Record<string, TLE>;

export default class TLEService {
  private _onUpdate = new SimpleEventDispatcher<TLEMap>();
  get onUpdate() {
    return this._onUpdate.asEvent();
  }

  private data: TLEMap = {};
  private defaultUrl =
    "https://api.codetabs.com/v1/proxy/?quest=http://celestrak.com/NORAD/elements/gp.php?GROUP=ACTIVE&FORMAT=TLE";
  async update(url = this.defaultUrl): Promise<TLEMap> {
    const plain = await (
      await fetch(url, { headers: { origin: "celestrak.com" } })
    ).text();
    const splitted = plain.trim().split("\n");
    for (let i = 0; i < splitted.length; i += 3) {
      const tle = [splitted[i], splitted[i + 1], splitted[i + 2]].map((s) => {
        return s?.trim();
      }) as TLE;
      const id = splitted[i + 1].substr(2, 5);
      this.data[id] = tle;
    }
    this._onUpdate.dispatch(this.data);
    return this.data;
  }
}
