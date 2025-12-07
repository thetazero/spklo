import type { Match } from "../engine/types.js";
import { loadMatches, loadMatchesCSV, new_matches_url } from "./load.js";

export const DatasetType = {
  OLD: "OLD",
  NEW: "NEW",
  BOTH: "BOTH"
} as const;

export type DatasetType = typeof DatasetType[keyof typeof DatasetType];

export class DatasetManager {
  private datasetType: DatasetType;
  private oldDataPath: string;
  private newDataUrl: string;

  constructor(
    datasetType: DatasetType = DatasetType.BOTH,
    oldDataPath: string = `${import.meta.env.BASE_URL}matches.json`,
    newDataUrl: string = new_matches_url
  ) {
    this.datasetType = datasetType;
    this.oldDataPath = oldDataPath;
    this.newDataUrl = newDataUrl;
  }

  async loadData(): Promise<Match[]> {
    switch (this.datasetType) {
      case DatasetType.OLD:
        return await this.loadOldData();

      case DatasetType.NEW:
        return await this.loadNewData();

      case DatasetType.BOTH:
        return await this.loadBothData();

      default:
        throw new Error(`Unknown dataset type: ${this.datasetType}`);
    }
  }

  private async loadOldData(): Promise<Match[]> {
    return await loadMatches(this.oldDataPath);
  }

  private async loadNewData(): Promise<Match[]> {
    return await loadMatchesCSV(this.newDataUrl);
  }

  private async loadBothData(): Promise<Match[]> {
    const [oldMatches, newMatches] = await Promise.all([
      this.loadOldData(),
      this.loadNewData()
    ]);
    return oldMatches.concat(newMatches);
  }

  setDatasetType(datasetType: DatasetType): void {
    this.datasetType = datasetType;
  }

  getDatasetType(): DatasetType {
    return this.datasetType;
  }
}