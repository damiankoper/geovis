import GeoPosition from "../../GeoPosition/interfaces/GeoPosition";
import Range from "../../GeoPosition/interfaces/Range";
import { TrackballMode } from "../enums/TrackballMode";
import * as THREE from "three";
import { IEvent } from "strongly-typed-events";

/**
 * Events are defined and handled using `strongly-typed-events` library
 * @external https://github.com/KeesCBakker/Strongly-Typed-Events-for-TypeScript#readme
 * @category Camera
 */
export default interface TrackballCamera {
  /**
   * Sets the distance between the center of the stage and the point the camera is looking at,
   * @param radius
   */
  setGlobalOrbitRadius(radius: number): TrackballCamera;
  getGlobalOrbitRadius(): number;

  /**
   * Sets the position on sphere of the point the camera is looking at,
   * @param position
   */
  setGlobalOrbitPosition(position: GeoPosition): TrackballCamera;
  getGlobalOrbitPosition(): GeoPosition;

  /**
   * Sets this distance between the point the camera is looking at and the camera itself,
   * @param radius
   */
  setLocalOrbitRadius(radius: number): TrackballCamera;
  getLocalOrbitRadius(): number;

  /**
   * Sets this distance between the point the camera is looking at and the camera itself,
   * @param radius
   */
  setLocalOrbitPosition(position: GeoPosition): TrackballCamera;
  getLocalOrbitPosition(): GeoPosition;

  /**
   * Sets upper left and lower right corners of part of sphere where camera can move,
   * @param bounds
   */
  setGlobalOrbitBounds(bounds: Range<GeoPosition>): TrackballCamera;
  getGlobalOrbitBounds(): Range<GeoPosition>;

  /**
   * Sets bounds of elevation in camera's local movement,
   * @param bounds
   */
  setLocalOrbitElevationBounds(bounds: Range): TrackballCamera;
  getLocalOrbitElevationBounds(): Range;

  /**
   * Sets camera's mode.
   * Compass - local orbit keeps its orientation to keep north at the same position relative to user.
   * Free - local orbit is free to rotate.
   * @param mode
   */
  setMode(mode: TrackballMode): TrackballCamera;
  getMode(): TrackballMode;

  /**
   * Sets global orbit's rotation speed when dragged.
   * @param factor
   * Defaults to `1`
   */
  setGlobalOrbitSlowFactor(factor: number): TrackballCamera;
  getGlobalOrbitSlowFactor(): number;

  /**
   * Sets local orbit's rotation speed when dragged with shift key or mousewheel button.
   * @param factor
   * Defaults to `1`
   */
  setLocalOrbitSlowFactor(factor: number): TrackballCamera;
  getLocalOrbitSlowFactor(): number;

  /**
   * Sets ease function used when dragged global orbit slows down.
   * @param fn
   */
  setGlobalOrbitEaseFn(fn: (t: number) => number): TrackballCamera;
  getGlobalOrbitEaseFn(): (t: number) => number;

  /**
   * Sets ease function used while animating zoom.
   * @param fn
   */
  setZoomEaseFn(fn: (t: number) => number): TrackballCamera;
  getZoomEaseFn(): (t: number) => number;

  /**
   * Sets how many times distance from local origin is changes when single zoom action is performed.
   * Zooming out: `factor`. Zooming in: `1/factor`.
   * @param factor Defaults to `0.5`
   */
  setZoomFactor(factor: number): TrackballCamera;
  getZoomFactor(): number;

  /**
   * Sets min and max zoom.
   * @param bounds Defaults to `[10000; 0.001]`
   */
  setZoomBounds(bounds: Range): TrackballCamera;
  getZoomBounds(): Range;

  /**
   * Sets zoom animation time in seconds.
   * @param time Defaults to `0.15`
   */
  setZoomTime(time: number): TrackballCamera;
  getZoomTime(): number;

  /**
   * Sets global orbit's movement break animation time in seconds.
   * @param time Defaults to `1`
   */
  setPanBreakTime(time: number): TrackballCamera;
  getPanBreakTime(): number;

  /**
   * Stops global orbit animation
   */
  stopMovement(): void;

  /**
   * Fired when north direction is changed relative to user
   * @event
   */
  onNorthAngleChange: IEvent<TrackballCamera, number>;

  /**
   * @event
   * */
  onGlobalOrbitChange: IEvent<TrackballCamera, THREE.Vector3>;
  /**
   * @event
   */
  onLocalOrbitChange: IEvent<TrackballCamera, THREE.Vector3>;
  /**
   * @event
   */
  onZoomChange: IEvent<TrackballCamera, number>;
}
