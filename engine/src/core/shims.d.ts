declare module "*.png" {
  const value: any;
  export = value;
}
declare module "*.jpg" {
  const value: any;
  export = value;
}
declare module "*.obj" {
  const value: any;
  export = value;
}

declare module "*.stl" {
  const value: any;
  export = value;
}
declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}

declare module "tle.js";
declare module "satellite.js";
