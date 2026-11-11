"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { magicLinkSchema } from "@/lib/validation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useDemoStore } from "@/lib/store/demo";
import { Logo } from "@/components/ui/logo";

export function LoginForm({ expired = false }: { expired?: boolean }) {
  const router = useRouter();
  const login = useDemoStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = magicLinkSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Geçerli bir e-posta girin");
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = getSupabaseClient();
        const { error: authError } = await supabase!.auth.signInWithOtp({
          email: parsed.data.email,
          options: {
            emailRedirectTo: `${window.location.origin}/panel`,
          },
        });
        if (authError) {
          setError("Bağlantı gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin.");
          return;
        }
        setSent(true);
      } else {
        // Demo mod: magic link e-postası gönderilmez, oturum doğrudan açılır.
        login(parsed.data.email);
        router.push("/panel");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center">
        <Logo className="justify-center" />
        <h1 className="mt-5 text-h2 font-extrabold">Panel girişi</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Şifre yok. E-posta adresinize gönderilen güvenli bağlantıyla giriş yapın.
        </p>
      </div>

      {expired ? (
        <div className="mt-5 rounded-xl border border-warning/30 bg-warning/10 p-3" role="alert">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Giriş bağlantısının süresi dolmuş
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Bağlantılar 1 saat geçerlidir. Aşağıdan yeni bir bağlantı isteyebilirsiniz.
          </p>
        </div>
      ) : null}

      <div className="card-soft mt-6 p-6">
        {sent ? (
          <div className="text-center">
            <Mail className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <h2 className="mt-3 text-base font-bold">Bağlantı gönderildi</h2>
            <p className="mt-1 text-sm text-ink-soft">
              <strong>{email}</strong> adresini kontrol edin. Bağlantı 1 saat geçerlidir.
            </p>
            <Button variant="ghost" className="mt-4" onClick={() => setSent(false)}>
              Farklı e-posta kullan
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="E-posta adresi"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
              error={error ?? undefined}
              placeholder="ornek@eposta.com"
            />
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Giriş bağlantısı gönder
            </Button>
          </form>
        )}
      </div>

      {!isSupabaseConfigured() ? (
        <div className="mt-4 rounded-xl border border-border-soft bg-surface-muted p-3">
          <p className="text-xs leading-relaxed text-ink-soft">
            <strong className="text-ink">Demo mod:</strong> Supabase anahtarları tanımlı olmadığı
            için e-posta gönderilmez; girdiğiniz adresle oturum doğrudan açılır.
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-center text-xs text-ink-soft">
        Giriş yaparak{" "}
        <a href="/kvkk" className="underline underline-offset-2">
          KVKK aydınlatma metnini
        </a>{" "}
        kabul etmiş olursunuz.
      </p>
    </div>
  );
}
