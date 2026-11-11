import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { Select } from "./select";

function renderSelect(props: Partial<ComponentProps<typeof Select>> = {}) {
  return render(
    <Select label="İl" name="il" {...props}>
      <option value="">İl seçin</option>
      <option value="Antalya">Antalya</option>
      <option value="İstanbul">İstanbul</option>
    </Select>,
  );
}

describe("Select", () => {
  it("label ile select'i ilişkilendirir", () => {
    renderSelect();
    const select = screen.getByLabelText("İl");
    expect(select).toHaveAttribute("name", "il");
    expect(select.tagName).toBe("SELECT");
  });

  it("seçim değişikliğini iletir", async () => {
    renderSelect();
    const select = screen.getByLabelText("İl");
    await userEvent.selectOptions(select, "Antalya");
    expect(select).toHaveValue("Antalya");
  });

  it("hata mesajını rolüyle gösterir ve aria-invalid verir", () => {
    renderSelect({ error: "İl zorunlu" });
    const select = screen.getByLabelText("İl");

    expect(screen.getByText("İl zorunlu")).toBeInTheDocument();
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("İl zorunlu");
  });

  it("hint metnini aria-describedby ile bağlar", () => {
    renderSelect({ hint: "Kurulum bölgeniz" });
    const select = screen.getByLabelText("İl");
    expect(select).toHaveAccessibleDescription("Kurulum bölgeniz");
  });
});
