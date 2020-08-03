import * as THREE from "three";
import moment from "moment";
export default class TimeService {
  // Source: https://www.pveducation.org/pvcdrom/properties-of-sunlight/solar-time
  static getHourAngle(fromTimezone = 0, longitude = 0) {
    const LSTM = 15 * fromTimezone;
    const timeLong = longitude;
    const B = (360 / 365) * (moment().dayOfYear() - 81);
    const EOT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const TC = 4 * (timeLong - LSTM) + EOT;
    const LST =
      moment.utc().diff(moment.utc().startOf("day"), "ms") / 3600000 + TC / 60;
    const HRA = 15 * (LST - 12);
    return THREE.MathUtils.degToRad(HRA);
  }
}
