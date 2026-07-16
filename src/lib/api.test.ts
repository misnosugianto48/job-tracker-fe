import { describe, it, expect } from "vitest";
import { friendlyError } from "./api";

describe("friendlyError helper", () => {
  it("should return the message of an Error instance", () => {
    const error = new Error("Network Timeout");
    expect(friendlyError(error)).toBe("Network Timeout");
  });

  it("should return a generic error message for non-Error instances", () => {
    expect(friendlyError("some string error")).toBe("Something went wrong. Please try again later.");
    expect(friendlyError(null)).toBe("Something went wrong. Please try again later.");
    expect(friendlyError({ code: 500 })).toBe("Something went wrong. Please try again later.");
  });
});
