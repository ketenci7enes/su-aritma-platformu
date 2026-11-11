import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("metni render eder ve tıklamayı iletir", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Sepete Ekle</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Sepete Ekle" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("primary varyantı accent rengini kullanır", () => {
    render(<Button>Birincil</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-accent");
  });

  it("secondary varyantı mavi outline kullanır", () => {
    render(<Button variant="secondary">İkincil</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-primary");
    expect(button).not.toHaveClass("bg-accent");
  });

  it("ghost varyantı zemin kullanmaz", () => {
    render(<Button variant="ghost">Hayalet</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-transparent");
  });

  it("disabled iken tıklama çalışmaz", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Kapalı
      </Button>,
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("yüklenirken aria-busy verir ve tıklamayı engeller", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Gönder
      </Button>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("klavye odağı için görünür halka sınıfı taşır", () => {
    render(<Button>Odak</Button>);
    expect(screen.getByRole("button").className).toContain("focus-visible:outline");
  });
});
