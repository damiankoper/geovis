import _ from "lodash";

export interface IVisualizationMeta {
  title: string;
  description: string;
  author: string;
  keywords: string[];
  thumbnailB64?: string;
}

/**
 * Contains base information about visualization.
 * Child visualization can overwrite parents' fields.
 * @category VisualizationBase
 */
export default class VisualizationMeta {
  protected title = "Title";
  protected description = "Description.";
  protected author = "GeoVis";
  protected keywords: string[] = ["vis"];
  protected thumbnailB64?: string;

  public setTitle(s: string) {
    this.title = s;
  }

  public setDescription(s: string) {
    this.description = s;
  }

  public setAuthor(s: string) {
    this.author = s;
  }

  public setKeywords(s: string[]) {
    this.keywords = s;
  }

  public addKeywords(s: string[]) {
    this.keywords.push(...s);
    this.keywords = _.uniq(this.keywords);
  }

  public setThumbnail(base64: string) {
    this.thumbnailB64 = base64;
  }

  /**
   * @returns Copy of fields in plain JS object
   */
  public getData(): IVisualizationMeta {
    return (_.assign({}, this) as unknown) as IVisualizationMeta;
  }
}
