import * as THREE from "three";
import moment from "moment";
export default class TimeService {
  static vernalEquinoxReference = moment.utc("2020-03-20 03:49:00");
  static solarYear = moment.duration({
    days: 365,
    hours: 5,
    minutes: 48,
    seconds: 46,
  });

  // Source: https://www.pveducation.org/pvcdrom/properties-of-sunlight/solar-time
  static getHourAngle(
    fromTimezone = 0,
    longitude = 0,
    timestamp = moment.utc()
  ) {
    const LSTM = 15 * fromTimezone;
    const timeLong = longitude;
    const B = (360 / 365) * (timestamp.dayOfYear() - 81);
    const EOT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const TC = 4 * (timeLong - LSTM) + EOT;
    const LST =
      timestamp.diff(timestamp.clone().startOf("day"), "ms") / 3600000 +
      TC / 60;
    const HRA = 15 * (LST - 12);
    return THREE.MathUtils.degToRad(HRA);
  }

  // Source: http://mypages.iit.edu/~maslanka/SolarGeo.pdf
  static getSunDeclination(timestamp = moment.utc()) {
    return Math.asin(0.39795 * Math.cos(0.08563 * timestamp.dayOfYear() - 173));
  }

  static getFirstPointOfAriesAngle(timestamp = moment.utc()) {
    const correctionAngle = Math.PI;
    const sinceVE = timestamp.diff(TimeService.vernalEquinoxReference, "ms");
    return (
      (2 * Math.PI * sinceVE) / TimeService.solarYear.asMilliseconds() +
      correctionAngle
    );
  }
}
