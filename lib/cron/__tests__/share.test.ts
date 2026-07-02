import { describe, it, expect } from "vitest";
import { encodeShare, decodeShare, buildShareUrl } from "../share";

describe("share params", () => {
  it("round-trips expr/tz/n", () => {
    const p = { expr: "0 9 * * 1-5", tz: "Asia/Kolkata", n: 25 };
    expect(decodeShare(encodeShare(p))).toEqual(p);
  });

  it("URL-encodes the expression's spaces", () => {
    expect(encodeShare({ expr: "0 9 * * 1-5", tz: "UTC", n: 10 })).toContain("expr=0+9");
  });

  it("ignores an out-of-range count", () => {
    expect(decodeShare("expr=*+*+*+*+*&n=500").n).toBeUndefined();
  });

  it("decodes a partial query", () => {
    expect(decodeShare("expr=%2A+9+%2A+%2A+%2A")).toEqual({ expr: "* 9 * * *" });
  });

  it("buildShareUrl composes base + query", () => {
    const url = buildShareUrl("https://x.io/CronLens/", { expr: "0 0 * * *", tz: "UTC", n: 5 });
    expect(url).toBe("https://x.io/CronLens/?expr=0+0+*+*+*&tz=UTC&n=5");
  });
});
