import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KanbanBoardComponent } from "../routes/board";

// Mock the API Fetch helper
vi.mock("../lib/api", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    apiFetch: vi.fn(),
  };
});

import { apiFetch } from "../lib/api";

const mockCompanies = [
  { id: 1, name: "Google" },
  { id: 2, name: "Meta" },
];

const mockApplications = [
  {
    id: 101,
    companyId: 1,
    company: { id: 1, name: "Google" },
    jobTitle: "Software Engineer",
    stage: "INTERVIEW",
    dateApplied: "2026-07-16T12:00:00Z",
    source: "LinkedIn",
    postingUrl: "https://google.com/jobs",
    expectedSalary: 120000000,
    resumeVersion: "v1.0-swe",
    notes: [],
    todos: [],
  },
];

describe("KanbanBoardComponent UI Tests", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.stubGlobal("localStorage", {
      getItem: vi.fn().mockReturnValue("My Resume Text"),
      setItem: vi.fn(),
    });

    vi.mocked(apiFetch).mockImplementation(async (url: string) => {
      if (url.includes("/companies")) {
        return mockCompanies;
      }
      if (url.includes("/applications/101")) {
        return mockApplications[0];
      }
      if (url.includes("/applications")) {
        return mockApplications;
      }
      return null;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <KanbanBoardComponent />
      </QueryClientProvider>
    );

  it("should render all Kanban columns", async () => {
    renderComponent();

    // Verify presence of column headers
    const columns = ["WISHLIST", "APPLIED", "ASSESSMENT", "INTERVIEW", "OFFERED", "REJECTED"];
    for (const col of columns) {
      const elements = await screen.findAllByText(new RegExp(col, "i"));
      expect(elements.length).toBeGreaterThan(0);
    }
  });

  it("should render mock application cards under correct columns", async () => {
    renderComponent();

    // Wait for applications to render
    const jobTitleElement = await screen.findByText(/Software Engineer/i);
    expect(jobTitleElement).toBeInTheDocument();
    expect(screen.getByText(/Google/i)).toBeInTheDocument();
  });

  it("should display AI Resume Tailoring, Interview Coach, and Outreach Writer sections in the details drawer", async () => {
    renderComponent();

    // Click on details button/card to open the details modal
    const jobCard = await screen.findByText(/Software Engineer/i);
    fireEvent.click(jobCard);

    // Verify Details modal elements are rendered
    expect(await screen.findByText(/AI Resume Tailoring/i)).toBeInTheDocument();
    expect(await screen.findByText(/AI Interview Coach/i)).toBeInTheDocument();
    expect(await screen.findByText(/AI Outreach Writer/i)).toBeInTheDocument();
  });

  it("should open practice session modal and start interview", async () => {
    renderComponent();

    const jobCard = await screen.findByText(/Software Engineer/i);
    fireEvent.click(jobCard);

    // Mock practice fetch history
    vi.mocked(apiFetch).mockImplementation(async (url: string) => {
      if (url.includes("/practice")) {
        return { messages: [] };
      }
      return null;
    });

    const practiceBtn = await screen.findByText(/Practice Interview/i);
    fireEvent.click(practiceBtn);

    // Verify practice modal opens
    expect(await screen.findByText(/Start Your Mock Interview Practice/i)).toBeInTheDocument();
  });
});
