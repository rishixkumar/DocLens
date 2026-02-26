/**
 * Tests for DocumentTypeSelector component
 *
 * Covers rendering, selection state, and click handlers.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { DocumentTypeSelector } from "./DocumentTypeSelector";

describe("DocumentTypeSelector", () => {
  it("renders all document type options", () => {
    render(<DocumentTypeSelector value="contracts" onChange={() => {}} />);
    expect(screen.getByText("Contracts & Legal Docs")).toBeInTheDocument();
    expect(screen.getByText("Research Papers")).toBeInTheDocument();
    expect(screen.getByText("Business Reports")).toBeInTheDocument();
    expect(screen.getByText("General PDF / Other")).toBeInTheDocument();
  });

  it("highlights selected type", () => {
    render(<DocumentTypeSelector value="research" onChange={() => {}} />);
    const researchBtn = screen.getByText("Research Papers");
    expect(researchBtn).toHaveClass("selected");
  });

  it("calls onChange when option clicked", () => {
    const onChange = vi.fn();
    render(<DocumentTypeSelector value="contracts" onChange={onChange} />);
    fireEvent.click(screen.getByText("Business Reports"));
    expect(onChange).toHaveBeenCalledWith("business");
  });

  it("shows Document Type label", () => {
    render(<DocumentTypeSelector value="general" onChange={() => {}} />);
    expect(screen.getByText("Document Type")).toBeInTheDocument();
  });
});
