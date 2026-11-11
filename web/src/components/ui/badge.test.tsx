import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";
import { Spinner } from "./spinner";

describe("Badge", () => {
  it("içeriği render eder", () => {
    render(<Badge>5 Aşamalı</Badge>);
    expect(screen.getByText("5 Aşamalı")).toBeInTheDocument();
  });

  it("success varyantı accent tint kullanır", () => {
    render(<Badge variant="success">Aktif</Badge>);
    expect(screen.getByText("Aktif")).toHaveClass("bg-accent-tint");
  });

  it("warning varyantı uyarı rengini kullanır", () => {
    render(<Badge variant="warning">Filtre azaldı</Badge>);
    expect(screen.getByText("Filtre azaldı").className).toContain("text-warning");
  });
});

describe("Spinner", () => {
  it("erişilebilir durum rolü taşır", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "Yükleniyor" })).toBeInTheDocument();
  });
});
