/**
 * Represents generic range. Type defaults to `number`.
 * @category Utils
 */
export default class Range<T = number> {
  constructor(public from: T, public to: T) {}
}
