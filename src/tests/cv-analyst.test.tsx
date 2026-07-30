import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CvAnalystComponent } from "../routes/cv-analyst";

// Mock the API Fetch helper
vi.mock("../lib/api", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    apiFetch: vi.fn(),
  };
});

import { apiFetch } from "../lib/api";

describe("CvAnalystComponent UI Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.mocked(apiFetch).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <CvAnalystComponent />
      </QueryClientProvider>
    );

  it("should render the drag and drop area and file input", () => {
    renderComponent();

    expect(screen.getByText(/Upload your CV\/Resume/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF or Plain Text/i)).toBeInTheDocument();
    expect(screen.getByTestId("cv-upload-input")).toBeInTheDocument();
  });

  it("should successfully upload a file, call analyze-cv API, and display results", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      atsScore: 85,
      strengths: [
        "Excellent TypeScript knowledge",
        "Clear professional summary",
      ],
      improvements: [
        "Include more concrete metrics",
      ],
      missingElements: [
        "Missing cloud technologies section",
      ],
      otherFeedback: "Overall good structure and typography.",
    });

    renderComponent();

    // Create a mock PDF file
    const file = new File(["%PDF-1.4 mock content"], "my_resume.pdf", {
      type: "application/pdf",
    });

    const input = screen.getByTestId("cv-upload-input");
    
    // Simulate file selection
    fireEvent.change(input, { target: { files: [file] } });

    // Expect loading text/state to be visible
    expect(screen.getByText(/Analyzing your CV/i)).toBeInTheDocument();

    // Wait for the API to resolve and content to render
    await waitFor(() => {
      expect(screen.getByText("Excellent TypeScript knowledge")).toBeInTheDocument();
    });

    expect(screen.getByText("Include more concrete metrics")).toBeInTheDocument();
    expect(screen.getByText("Missing cloud technologies section")).toBeInTheDocument();
    expect(screen.getByText("Overall good structure and typography.")).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();

    // Verify API request details
    expect(apiFetch).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(apiFetch).mock.calls[0];
    expect(callArgs[0]).toContain("/api/ai/analyze-cv");
    expect(callArgs[1]?.method).toBe("POST");
    
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body).toHaveProperty("fileBase64");
    expect(body.mimeType).toBe("application/pdf");
  });

  it("should render the drag and drop area, file input, and limit notice", () => {
    renderComponent();

    expect(screen.getByText(/Upload your CV\/Resume/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF or Plain Text/i)).toBeInTheDocument();
    expect(screen.getByText(/Max size: 5MB/i)).toBeInTheDocument();
    expect(screen.getByTestId("cv-upload-input")).toBeInTheDocument();
  });

  it("should successfully upload a file and compare it against the entered job description", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      atsScore: 90,
      strengths: ["Matches job description"],
      improvements: ["More React metrics"],
      missingElements: ["Missing Docker"],
      otherFeedback: "Perfect match.",
    });

    renderComponent();

    // Type a job description
    const jobDescriptionTextarea = screen.getByPlaceholderText(/Paste the job description here/i);
    fireEvent.change(jobDescriptionTextarea, { target: { value: "Looking for a React developer with Docker" } });

    // Upload a mock file
    const file = new File(["%PDF-1.4 mock content"], "resume.pdf", {
      type: "application/pdf",
    });
    const input = screen.getByTestId("cv-upload-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Matches job description")).toBeInTheDocument();
    });

    // Check api call args
    expect(apiFetch).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(apiFetch).mock.calls[0];
    const body = JSON.parse(callArgs[1]?.body as string);
    expect(body.jobDescription).toBe("Looking for a React developer with Docker");
  });

  it("should display error message when the selected file exceeds 5MB", async () => {
    renderComponent();

    // Create a 6MB dummy file
    const largeBuffer = new Uint8Array(6 * 1024 * 1024);
    const file = new File([largeBuffer], "huge_resume.pdf", {
      type: "application/pdf",
    });

    const input = screen.getByTestId("cv-upload-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/File size exceeds the 5MB limit/i)).toBeInTheDocument();
    });
    
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("should display error message when the API request fails", async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error("Gemini API failed to parse document"));

    renderComponent();

    const file = new File(["dummy txt"], "resume.txt", {
      type: "text/plain",
    });

    const input = screen.getByTestId("cv-upload-input");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Gemini API failed to parse document/i)).toBeInTheDocument();
    });
  });
});
