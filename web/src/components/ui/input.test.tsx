import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("label ile input'u ilişkilendirir", () => {
    render(<Input label="E-posta" name="email" />);
    const input = screen.getByLabelText("E-posta");
    expect(input).toHaveAttribute("name", "email");
  });

  it("hata mesajını rolüyle gösterir ve aria-invalid verir", () => {
    render(<Input label="Telefon" name="phone" error="Telefon zorunlu" />);
    const input = screen.getByLabelText("Telefon");

    expect(screen.getByText("Telefon zorunlu")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Telefon zorunlu");
  });

  it("hata yokken aria-invalid false olur", () => {
    render(<Input label="Ad" name="name" />);
    expect(screen.getByLabelText("Ad")).toHaveAttribute("aria-invalid", "false");
  });

  it("yazmayı kabul eder", async () => {
    render(<Input label="Ad" name="name" />);
    const input = screen.getByLabelText("Ad");
    await userEvent.type(input, "Ayşe");
    expect(input).toHaveValue("Ayşe");
  });
});
