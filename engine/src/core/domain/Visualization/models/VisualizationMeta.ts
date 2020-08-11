import _ from "lodash";
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

  setTitle(s: string) {
    this.title = s;
  }

  setDescription(s: string) {
    this.description = s;
  }

  setAuthor(s: string) {
    this.author = s;
  }

  setKeywords(s: string[]) {
    this.keywords = s;
  }

  addKeywords(s: string[]) {
    this.keywords.push(...s);
  }

  setThumbnail(base64: string) {
    this.thumbnailB64 = base64;
  }

  /**
   * @returns Copy of fields in plain JS object
   */
  getData() {
    return _.assign({}, this);
  }
}
