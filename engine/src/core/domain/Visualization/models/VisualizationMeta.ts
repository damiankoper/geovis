import _ from "lodash";
export default class VisualizationMeta {
  protected title = "Title";
  protected description = "Description.";
  protected author = "GeoVis";
  protected keywords: string[] = ["vis"];

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

  getData() {
    return _.assign({}, this);
  }
}
