import type { Metadata } from "next";
import { QuizWizard } from "@/components/quiz/quiz-wizard";

export const metadata: Metadata = {
  title: "Cihaz Bul",
  description:
    "İl/ilçe su sertliği ve hane büyüklüğüne göre size en uygun su arıtma cihazını 60 saniyede bulun.",
  alternates: { canonical: "/cihaz-bul" },
};

export default function QuizPage() {
  return (
    <div className="min-h-[70vh] bg-surface-muted/60 py-10 md:py-14">
      <div className="container-page">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-h1 font-extrabold text-balance">Size uygun cihazı bulalım</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-ink-soft">
            Bölgenizin su sertliği ve kullanım alışkanlıklarınıza göre doğru kapasiteyi öneriyoruz.
            Ortalama süre: 60 saniye.
          </p>
        </div>
        <QuizWizard />
      </div>
    </div>
  );
}
