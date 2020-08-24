import NumUtils from "../NumUtils";

describe("NumUtils", () => {
  it.each([
    [1, 1],
    [1.1, 1],
    [1.5, 1],
    [1.5001, 2],
    [3.4, 3],
    [3.6, 3],
    [50, 40],
    [-15, -0.5],
    [-15.5, -30],
  ])("should return closest to %f", (goal: number, expected: number) => {
    const counts = [1, 2, 3, 10, 40, 100, -0.5, -30];
    const result = NumUtils.getClosest(counts, goal);
    expect(result).toBe(expected);
  });

  it.each([
    [1, 0, 2, true],
    [1, 2, 0, false],
    [-1, 2, 0, true],
    [-1, 2, 0, true],
    [2, 0, 2, false],
    [1.999999, 0, 2, true],
    [0, 0, 2, true],
    [-0.00001, 0, 2, false],
  ])(
    "should check if %f is in range [%f, %f] with cycle respected - %p",
    (n: number, from: number, to: number, b: boolean) => {
      const result = NumUtils.inCycleRange(n, from, to);
      expect(result).toBe(b);
    }
  );
});
