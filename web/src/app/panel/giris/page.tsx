import type { Metadata } from "next";
import { LoginForm } from "@/components/panel/login-form";

export const metadata: Metadata = {
  title: "Panel girişi",
  description: "Magic link ile şifresiz müşteri paneli girişi.",
  robots: { index: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string }>;
}) {
  const { hata } = await searchParams;

  return (
    <div className="bg-surface-muted/50 py-12 md:py-20">
      <div className="container-page">
        <LoginForm expired={hata === "suresi-doldu"} />
      </div>
    </div>
  );
}
