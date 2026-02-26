/**
 * Tests for ApiKeySection component
 *
 * Covers input rendering, visibility toggle, and API note.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiKeySection } from "./ApiKeySection";

describe("ApiKeySection", () => {
  it("renders API key input with placeholder", () => {
    render(
      <ApiKeySection
        apiKey=""
        onApiKeyChange={() => {}}
        isVisible={false}
        onToggleVisibility={() => {}}
      />
    );
    expect(
      screen.getByPlaceholderText("Enter your Groq API key")
    ).toBeInTheDocument();
  });

  it("masks key when isVisible is false", () => {
    render(
      <ApiKeySection
        apiKey="secret123"
        onApiKeyChange={() => {}}
        isVisible={false}
        onToggleVisibility={() => {}}
      />
    );
    const input = screen.getByPlaceholderText("Enter your Groq API key");
    expect(input).toHaveAttribute("type", "password");
  });

  it("shows key when isVisible is true", () => {
    render(
      <ApiKeySection
        apiKey="secret123"
        onApiKeyChange={() => {}}
        isVisible={true}
        onToggleVisibility={() => {}}
      />
    );
    const input = screen.getByPlaceholderText("Enter your Groq API key");
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("secret123");
  });

  it("calls onApiKeyChange when input changes", async () => {
    const onApiKeyChange = vi.fn();
    render(
      <ApiKeySection
        apiKey=""
        onApiKeyChange={onApiKeyChange}
        isVisible={true}
        onToggleVisibility={() => {}}
      />
    );
    await userEvent.type(
      screen.getByPlaceholderText("Enter your Groq API key"),
      "abc"
    );
    expect(onApiKeyChange).toHaveBeenCalled();
  });

  it("calls onToggleVisibility when toggle button clicked", () => {
    const onToggleVisibility = vi.fn();
    render(
      <ApiKeySection
        apiKey=""
        onApiKeyChange={() => {}}
        isVisible={false}
        onToggleVisibility={onToggleVisibility}
      />
    );
    fireEvent.click(screen.getByTitle("Show key"));
    expect(onToggleVisibility).toHaveBeenCalled();
  });

  it("displays API note about storage", () => {
    render(
      <ApiKeySection
        apiKey=""
        onApiKeyChange={() => {}}
        isVisible={false}
        onToggleVisibility={() => {}}
      />
    );
    expect(
      screen.getByText(/Your API key is stored locally/)
    ).toBeInTheDocument();
  });
});
