import GeoVisCoreVue from "./components/GeoVisCore.vue";
import EarthVis from "./core/domain/Visualization/examples/EarthVis/EarthVis";
import AtmosphereVis from "./core/domain/Visualization/examples/AtmosphereVis/AtmosphereVis";
import ActiveSatellitesVis from "./core/domain/Visualization/examples/ActiveSatellitesVis/ActiveSatellitesVis";
import IssVis from "./core/domain/Visualization/examples/IssVis/IssVis";
import TilesVis from "./core/domain/Visualization/examples/OsmTilesVis/OsmTilesVis";
import StarsVis from "./core/domain/Visualization/examples/StarsVis/StarsVis";
import EmptyVis from "./core/domain/Visualization/examples/EmptyVis/EmptyVis";

export default GeoVisCoreVue;
export { default as Visualization } from "./core/domain/Visualization/models/Visualization";
export { default as VisualizationMeta } from "./core/domain/Visualization/models/VisualizationMeta";
export { default as TrackballCamera } from "./core/domain/Camera/interfaces/TrackballCamera";

export const Examples = {
  EmptyVis,
  EarthVis,
  AtmosphereVis,
  ActiveSatellitesVis,
  IssVis,
  TilesVis,
  StarsVis,
};
