import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { friendlyError, apiFetch } from "./api";

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

describe("apiFetch client integration for AI features", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should successfully fetch tailored resume suggestions", async () => {
    const mockResponse = {
      keySkills: ["React", "TypeScript"],
      missingKeywords: ["Next.js"],
      coverLetter: "Hello Hiring Manager...",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await apiFetch("/api/ai/tailor", {
      method: "POST",
      body: JSON.stringify({
        resumeText: "Experienced React SWE",
        jobDescription: "Next.js engineer wanted",
      }),
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith("/api/ai/tailor", expect.any(Object));
  });

  it("should successfully fetch mock interview Q&A responses", async () => {
    const mockResponse = {
      role: "model",
      content: "Explain React's reconciliation process.",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await apiFetch("/api/applications/1/practice/chat", {
      method: "POST",
      body: JSON.stringify({ message: "Let's start" }),
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith("/api/applications/1/practice/chat", expect.any(Object));
  });

  it("should successfully generate outreach message suggestions", async () => {
    const mockResponse = {
      subject: "Follow up",
      content: "Dear recruiter...",
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await apiFetch("/api/ai/outreach", {
      method: "POST",
      body: JSON.stringify({
        type: "EMAIL",
        intent: "FOLLOW_UP",
        companyName: "Google",
        jobTitle: "SWE",
      }),
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith("/api/ai/outreach", expect.any(Object));
  });

  it("should handle validation error response from AI endpoints", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "jobDescription is required and cannot be empty" }),
    } as Response);

    await expect(
      apiFetch("/api/ai/tailor", {
        method: "POST",
        body: JSON.stringify({ resumeText: "React developer" }),
      })
    ).rejects.toThrow("jobDescription is required and cannot be empty");
  });
});
