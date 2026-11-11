import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./progress-bar";

describe("ProgressBar", () => {
  it("değeri progressbar rolü ve aria-valuenow ile bildirir", () => {
    render(<ProgressBar value={42} label="Filtre ömrü" />);
    const bar = screen.getByRole("progressbar", { name: "Filtre ömrü" });

    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "42");
  });

  it("0-100 aralığına sınırlar ve yuvarlar", () => {
    const { rerender } = render(<ProgressBar value={-5} label="Filtre ömrü" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    rerender(<ProgressBar value={140.6} label="Filtre ömrü" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
