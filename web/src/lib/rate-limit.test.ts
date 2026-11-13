import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, __resetRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    __resetRateLimit();
    vi.useRealTimers();
  });

  it("limit altindaki istekleri gecirir", () => {
    expect(checkRateLimit("ip-1", 3, 60_000)).toBe(true);
    expect(checkRateLimit("ip-1", 3, 60_000)).toBe(true);
    expect(checkRateLimit("ip-1", 3, 60_000)).toBe(true);
  });

  it("limit asilinca reddeder", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("ip-2", 3, 60_000);
    expect(checkRateLimit("ip-2", 3, 60_000)).toBe(false);
  });

  it("anahtarlari ayri tutar", () => {
    for (let i = 0; i < 3; i += 1) checkRateLimit("ip-3", 3, 60_000);
    expect(checkRateLimit("ip-4", 3, 60_000)).toBe(true);
  });

  it("pencere dolunca yeniden izin verir", () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i += 1) checkRateLimit("ip-5", 3, 1000);
    expect(checkRateLimit("ip-5", 3, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit("ip-5", 3, 1000)).toBe(true);
  });
});
