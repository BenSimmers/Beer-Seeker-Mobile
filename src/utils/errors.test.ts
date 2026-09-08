import { describe, expect, it } from "vitest";
import { errorMessage, isAbort } from "./errors";

describe("isAbort", () => {
  it("recognises an error named AbortError", () => {
    expect(isAbort(Object.assign(new Error("Aborted"), { name: "AbortError" }))).toBe(true);
  });

  it("rejects other errors and non-errors", () => {
    expect(isAbort(new Error("boom"))).toBe(false);
    expect(isAbort({ name: "AbortError" })).toBe(false);
    expect(isAbort("AbortError")).toBe(false);
    expect(isAbort(null)).toBe(false);
  });
});

describe("errorMessage", () => {
  it("uses the error's own message", () => {
    expect(errorMessage(new Error("Places HTTP 500"), "fallback")).toBe("Places HTTP 500");
  });

  it("falls back for thrown non-errors", () => {
    expect(errorMessage("a string", "fallback")).toBe("fallback");
    expect(errorMessage(undefined, "fallback")).toBe("fallback");
    expect(errorMessage({ message: "not an Error" }, "fallback")).toBe("fallback");
  });
});
