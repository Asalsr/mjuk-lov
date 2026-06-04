import { notFound } from "next/navigation";
import { isLang, ui, type Lang } from "@/lib/i18n";
import { RecipeShell } from "@/app/components/recipe/RecipeShell";
import { ResetPasswordForm } from "@/app/components/auth/ResetPasswordForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;
  const t = ui[lang];

  return (
    <RecipeShell lang={lang} altPath={`/${lang === "sv" ? "en" : "sv"}/aterstall`}>
      <section
        className="pt-32 md:pt-40 pb-[clamp(4rem,10vw,9rem)] px-4 md:px-8"
        style={{ backgroundColor: "var(--vanilla-cream)" }}
      >
        <div className="max-w-[480px] mx-auto" lang={lang}>
          <h1 className="mb-8" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}>{t.resetPassword}</h1>
          <ResetPasswordForm lang={lang} />
        </div>
      </section>
    </RecipeShell>
  );
}
