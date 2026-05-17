// @vitest-environment node
import { describe, it, expect } from "vitest";
import { formatNumber, formatDuration, formatCost, COLORS } from "../../src/utils.js";

describe("formatNumber", () => {
  it("returns the number as-is for values below 1000", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1)).toBe("1");
  });

  it("formats thousands with K suffix", () => {
    expect(formatNumber(1000)).toBe("1.0K");
    expect(formatNumber(1500)).toBe("1.5K");
    expect(formatNumber(999999)).toBe("1000.0K");
  });

  it("formats millions with M suffix", () => {
    expect(formatNumber(1000000)).toBe("1.0M");
    expect(formatNumber(2500000)).toBe("2.5M");
  });

  it("prefers M over K for values >= 1 million", () => {
    expect(formatNumber(1000000)).toContain("M");
    expect(formatNumber(1000000)).not.toContain("K");
  });
});

describe("formatDuration", () => {
  it("formats minutes for durations under 60", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(1)).toBe("1m");
    expect(formatDuration(59)).toBe("59m");
  });

  it("formats hours for durations >= 60 minutes", () => {
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("2h");
    expect(formatDuration(120)).toBe("2h");
  });

  it("rounds to nearest hour", () => {
    expect(formatDuration(61)).toBe("1h");
    expect(formatDuration(89)).toBe("1h");
    expect(formatDuration(91)).toBe("2h");
  });
});

describe("formatCost", () => {
  it("uses 6 decimal places for tiny amounts", () => {
    expect(formatCost(0.000001)).toBe("$0.000001");
  });

  it("returns $0.00 for zero cost", () => {
    expect(formatCost(0)).toBe("$0.00");
  });

  it("uses 3 decimal places for amounts in the cent range", () => {
    expect(formatCost(0.01)).toBe("$0.010");
    expect(formatCost(0.099)).toBe("$0.099");
  });

  it("uses 2 decimal places for dollar amounts", () => {
    expect(formatCost(1)).toBe("$1.00");
    expect(formatCost(1.5)).toBe("$1.50");
    expect(formatCost(100)).toBe("$100.00");
  });

  it("always includes the $ prefix", () => {
    expect(formatCost(0)).toMatch(/^\$/);
    expect(formatCost(0.001)).toMatch(/^\$/);
    expect(formatCost(5)).toMatch(/^\$/);
  });
});

describe("COLORS", () => {
  it("exports a non-empty array of color strings", () => {
    expect(Array.isArray(COLORS)).toBe(true);
    expect(COLORS.length).toBeGreaterThan(0);
  });

  it("all colors are valid hex strings", () => {
    for (const color of COLORS) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
