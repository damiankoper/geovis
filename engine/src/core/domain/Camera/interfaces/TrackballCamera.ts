import GeoPosition from "../../GeoPosition/models/GeoPosition";
import Range from "../../GeoPosition/models/Range";
import { TrackballMode } from "../enums/TrackballMode";
import { IEvent } from "strongly-typed-events";
import Orbit from "../../GeoPosition/models/Orbit";

/**
 * Events are defined and handled using `strongly-typed-events` library
 * @external https://github.com/KeesCBakker/Strongly-Typed-Events-for-TypeScript#readme
 * @category Camera
 */
export default interface TrackballCamera {
  /**
   * Get global orbit object,
   */
  getGlobalOrbit(): Orbit;

  /**
   * Set the distance between the center of the stage and the point the camera is looking at,
   * @param radius
   */
  setGlobalOrbitRadius(radius: number): TrackballCamera;
  /**
   * Get the distance between the center of the stage and the point the camera is looking at,
   */
  getGlobalOrbitRadius(): number;

  /**
   * Set the position on sphere of the point the camera is looking at,
   * @param position
   */
  setGlobalOrbitPosition(position: GeoPosition): TrackballCamera;
  /**
   * Get the position on sphere of the point the camera is looking at,
   */
  getGlobalOrbitPosition(): GeoPosition;

  /**
   * Set this distance between the point the camera is looking at and the camera itself,
   * @param radius
   */
  setLocalOrbitRadius(radius: number): TrackballCamera;
  /**
   * Get this distance between the point the camera is looking at and the camera itself,
   */
  getLocalOrbitRadius(): number;

  /**
   * Set this distance between the point the camera is looking at and the camera itself,
   * @param radius
   */
  setLocalOrbitPosition(position: GeoPosition): TrackballCamera;
  /**
   * Get this distance between the point the camera is looking at and the camera itself,
   */
  getLocalOrbitPosition(): GeoPosition;

  /**
   * Set upper left and lower right corners of part of sphere where camera can move,
   * @param bounds
   */
  setGlobalOrbitBounds(bounds: Range<GeoPosition>): TrackballCamera;
  /**
   * Get upper left and lower right corners of part of sphere where camera can move,
   */
  getGlobalOrbitBounds(): Range<GeoPosition>;

  /**
   * Set bounds of in camera's local movement,
   * @param bounds
   */
  setLocalOrbitBounds(bounds: Range<GeoPosition>): TrackballCamera;
  /**
   * Get bounds of in camera's local movement,
   */
  getLocalOrbitBounds(): Range<GeoPosition>;

  /**
   * Set camera's mode.
   * Compass - local orbit keeps its orientation to keep north at the same position relative to user.
   * Free - local orbit is free to rotate.
   * @param mode
   */
  setMode(mode: TrackballMode): TrackballCamera;
  /**
   * Get camera's mode.
   * Compass - local orbit keeps its orientation to keep north at the same position relative to user.
   * Free - local orbit is free to rotate.
   */
  getMode(): TrackballMode;

  /**
   * Set global orbit's rotation speed when dragged.
   * @param factor
   * Defaults to `1`
   */
  setGlobalOrbitSlowFactor(factor: number): TrackballCamera;
  /**
   * Get global orbit's rotation speed when dragged.
   * Defaults to `1`
   */
  getGlobalOrbitSlowFactor(): number;

  /**
   * Set local orbit's rotation speed when dragged with shift key or mousewheel button.
   * @param factor
   * Defaults to `1`
   */
  setLocalOrbitSlowFactor(factor: number): TrackballCamera;
  /**
   * Get local orbit's rotation speed when dragged with shift key or mousewheel button.
   * Defaults to `1`
   */
  getLocalOrbitSlowFactor(): number;

  /**
   * Set ease function used when dragged global orbit slows down.
   * @param fn
   */
  setGlobalOrbitEaseFn(fn: (t: number) => number): TrackballCamera;
  /**
   * Get ease function used when dragged global orbit slows down.
   */
  getGlobalOrbitEaseFn(): (t: number) => number;

  /**
   * Set ease function used while animating zoom.
   * @param fn
   */
  setZoomEaseFn(fn: (t: number) => number): TrackballCamera;
  /**
   * Get ease function used while animating zoom.
   */
  getZoomEaseFn(): (t: number) => number;

  /**
   * Set how many times distance from local origin is changes when single zoom action is performed.
   * Zooming out: `factor`. Zooming in: `1/factor`.
   * @param factor Defaults to `0.5`
   */
  setZoomFactor(factor: number): TrackballCamera;
  /**
   * Get how many times distance from local origin is changes when single zoom action is performed.
   * Zooming out: `factor`. Zooming in: `1/factor`.
   */
  getZoomFactor(): number;

  /**
   * Set min and max zoom.
   * @param bounds Defaults to `[10000; 0.001]`
   */
  setZoomBounds(bounds: Range): TrackballCamera;
  /**
   * Get min and max zoom.
   */
  getZoomBounds(): Range;

  /**
   * Set zoom animation time in seconds.
   * @param time Defaults to `0.15`
   */
  setZoomTime(time: number): TrackballCamera;
  /**
   * Get zoom animation time in seconds.
   */
  getZoomTime(): number;

  /**
   * Set global orbit's movement break animation time in seconds.
   * @param time Defaults to `1`
   */
  setPanBreakTime(time: number): TrackballCamera;
  /**
   * Get global orbit's movement break animation time in seconds.
   */
  getPanBreakTime(): number;

  /**
   * Set rotate towards north animation time in seconds.
   * @param time Defaults to `1`
   */
  setRotateNorthTime(time: number): void;
  /**
   * Get rotate towards north animation time in seconds.
   */
  getRotateNorthTime(): number;

  /**
   * Get north angle in radians
   */
  getNorthAngle(): number;

  /**
   * Stops global orbit animation
   */
  stopMovement(): void;

  /**
   * Rotates local orbit towards north direction
   */
  rotateNorth(): void;

  /**
   * Zoomes in `n` times
   */
  zoomIn(times: number): void;

  /**
   * Zoomes out `n` times
   */
  zoomOut(times: number): void;

  /**
   * Fired when north direction is changed relative to user
   * @event
   */
  onNorthAngleChange: IEvent<TrackballCamera, number>;

  /**
   * Fired when global orbit changes
   * @event
   * */
  onGlobalOrbitChange: IEvent<TrackballCamera, Orbit>;

  /**
   * Fired when local orbit changes
   * @event
   */
  onLocalOrbitChange: IEvent<TrackballCamera, Orbit>;

  /**
   * Fired when zoom changes
   * @event
   */
  onZoomChange: IEvent<TrackballCamera, number>;
}
