import * as THREE from "three";
import moment from "moment";
export default class TimeService {
  // Source: https://www.pveducation.org/pvcdrom/properties-of-sunlight/solar-time
  static getHourAngle(
    fromTimezone = 0,
    longitude = 0,
    timestamp = +moment.utc()
  ) {
    const LSTM = 15 * fromTimezone;
    const timeLong = longitude;
    const B = (360 / 365) * (moment.utc(timestamp).dayOfYear() - 81);
    const EOT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const TC = 4 * (timeLong - LSTM) + EOT;
    const LST =
      moment.utc(timestamp).diff(moment.utc(timestamp).startOf("day"), "ms") /
        3600000 +
      TC / 60;
    const HRA = 15 * (LST - 12);
    return THREE.MathUtils.degToRad(HRA);
  }

  // Source: http://mypages.iit.edu/~maslanka/SolarGeo.pdf
  static getSunDeclination(timestamp = +moment.utc()) {
    return Math.asin(
      0.39795 * Math.cos(0.08563 * (moment.utc(timestamp).dayOfYear() - 173))
    );
  }

  static getFirstPointOfAriesAngle(timestamp: number = +moment.utc()) {
    const dayOfYearFrac =
      moment.utc(timestamp).dayOfYear() +
      moment.utc(timestamp).diff(moment.utc().startOf("day"), "ms") /
        3600000 /
        24;
    const correctionAngle = Math.PI;
    const correctionDays = -2.25;
    return (
      (2 * Math.PI * (dayOfYearFrac - 80 + correctionDays)) /
        (moment.utc(timestamp).isLeapYear() ? 365 : 366) +
      correctionAngle
    );
  }
}
