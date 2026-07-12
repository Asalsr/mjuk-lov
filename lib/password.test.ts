import { describe, it, expect } from "vitest";
import { localPasswordIssues, weakPasswordIssues, MIN_PASSWORD_LENGTH } from "./password";

describe("localPasswordIssues", () => {
  it("flags a password that's too short", () => {
    const issues = localPasswordIssues("a1", "en");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags a password with no letter", () => {
    const issues = localPasswordIssues("123456", "en");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("flags a password with no digit", () => {
    const issues = localPasswordIssues("abcdef", "en");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("passes a password meeting length + letter + digit", () => {
    expect(localPasswordIssues("abc123", "en")).toEqual([]);
    expect("abc123".length).toBe(MIN_PASSWORD_LENGTH);
  });

  it("can report multiple issues at once", () => {
    // 1 char, no letter, no digit-having only a symbol
    expect(localPasswordIssues("!", "en").length).toBe(3);
  });
});

describe("weakPasswordIssues", () => {
  it("returns null when there's no error", () => {
    expect(weakPasswordIssues(null, "abc123", "en")).toBeNull();
  });

  it("returns null for an error unrelated to password strength", () => {
    expect(weakPasswordIssues({ code: "invalid_credentials", message: "bad login" }, "abc123", "en")).toBeNull();
  });

  it("maps the 'length' reason to the too-short message", () => {
    const issues = weakPasswordIssues({ code: "weak_password", reasons: ["length"] }, "a1", "en");
    expect(issues).not.toBeNull();
    expect(issues!.length).toBeGreaterThan(0);
  });

  it("maps the 'characters' reason to the specific missing classes", () => {
    const issues = weakPasswordIssues({ code: "weak_password", reasons: ["characters"] }, "123456", "en");
    expect(issues).not.toBeNull();
    // "123456" has digits but no letters, so only the letter issue should show.
    expect(issues!.length).toBe(1);
  });

  it("maps the 'pwned' reason to a distinct message", () => {
    const issues = weakPasswordIssues({ code: "weak_password", reasons: ["pwned"] }, "abc123", "en");
    expect(issues).toEqual([expect.any(String)]);
  });

  it("recognises a weak-password error via the reasons array even without the code", () => {
    const issues = weakPasswordIssues({ reasons: ["length"] }, "a1", "en");
    expect(issues).not.toBeNull();
  });

  it("recognises a weak-password error via a message mentioning 'password'", () => {
    const issues = weakPasswordIssues({ message: "Password is too weak" }, "abc123", "en");
    expect(issues).not.toBeNull();
  });

  it("falls back to the raw server message when no specific reason maps", () => {
    const issues = weakPasswordIssues({ code: "weak_password", message: "too weak, somehow", reasons: [] }, "abc123", "en");
    expect(issues).toEqual(["too weak, somehow"]);
  });
});
