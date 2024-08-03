import { readdir } from "node:fs/promises";

import { NIPPO_CSV_GZ, nippoDir } from "./const";
import { createArray, fsRemove } from "./util";
import { loadNippo } from "./nippo";

const DAY_MS = 86400 * 1000;

export class NippoManager {
  #type: string;
  #forceDL: boolean;

  static #regexType = /^[^0-9/]+/;
  static #regexPath = /[0-9]+\/[0-9]+\/[0-9]+\.png/;

  constructor(type = 'std', forceDL = true) {
    this.#type = type;
    this.#forceDL = forceDL;
  }

  getLatestNippoDates(): Date[] {
    const today = new Date();
    const lastMonth = (today.getMonth() + 11) % 12;
    const dayFrom = new Date(today.getFullYear(), lastMonth, 1);
    const days = Math.trunc((today.getTime() - dayFrom.getTime()) / DAY_MS);

    return createArray(days, (i) => new Date(dayFrom.getTime() + i * DAY_MS));
  }

  async removeFiles() {
    const ps: Array<Promise<void>> = [];
    const dir = nippoDir(this.#type);
    for (const file of (await readdir(dir))) {
      if (file.endsWith(NIPPO_CSV_GZ)) {
        ps.push(fsRemove(`${dir}/${file}`))
      }
    }
    await Promise.allSettled(ps);
  }

  async getMergedLatestNippoDict(): Promise<Record<string, string>> {
    const dict: Record<string, string> = {};

    for (const date of this.getLatestNippoDates()) {
      const nippo = await loadNippo(date, this.#type, this.#forceDL);
      if (nippo == null) continue;
      for await (const chunk of nippo.stream) {
        const [rawPath, _1, _2, md5Sum] = chunk;
        const type = rawPath.match(NippoManager.#regexType);
        const path = rawPath.match(NippoManager.#regexPath);

        if (type && path && type[0] === this.#type) {
          dict[path[0]] = md5Sum;
        }
      }
    }

    console.log(dict);

    return dict;
  }
}
