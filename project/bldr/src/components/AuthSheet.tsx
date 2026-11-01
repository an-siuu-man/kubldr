/**
 * AuthSheet.tsx
 *
 * Shared shell for the login and signup pages: a single worksheet slip on
 * the desk, with the canary and pink copies peeking out beneath it.
 */
import Link from "next/link";

export const authInputClass =
  "h-11 border-2 border-input bg-card text-[16px] shadow-none focus-visible:border-ballpoint focus-visible:ring-0";

export const authLabelClass = "form-label mb-1.5 block";

export default function AuthSheet({
  slip,
  title,
  description,
  children,
  footer,
  backHref = "/",
  backLabel = "Back to home",
}: {
  slip: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-desk text-foreground">
      <header className="border-b border-rule-strong">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between px-4 py-3 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="bldr home"
          >
            <img
              src="/logo.svg"
              alt=""
              className="h-9 w-auto"
              draggable={false}
            />
            <span className="font-black text-[28px] leading-none tracking-[-0.03em] text-crimson [font-stretch:125%]">
              bldr
            </span>
          </Link>
          <Link
            href={backHref}
            className="inline-flex min-h-10 items-center px-3 text-[15px] font-bold text-crimson [font-stretch:88%] hover:bg-accent"
          >
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="flex justify-center px-4 py-10 sm:py-16">
        <div className="relative w-full max-w-[30rem] pb-4 pr-3">
          <div
            aria-hidden
            className="absolute inset-0 bottom-4 right-3 translate-x-3 translate-y-3 rotate-[0.8deg] border-2 border-crimson bg-pink"
          />
          <div
            aria-hidden
            className="absolute inset-0 bottom-4 right-3 translate-x-1.5 translate-y-1.5 rotate-[0.4deg] border-2 border-crimson bg-canary"
          />
          <div className="relative border-2 border-crimson bg-card shadow-[0_18px_40px_-24px_rgb(74_30_20/0.45)]">
            <div className="flex items-center justify-between gap-3 border-b-2 border-crimson px-5 py-2.5 sm:px-7">
              <p className="form-label">{slip}</p>
              <p className="form-label hidden sm:block">
                Flagship Schedule Builder
              </p>
            </div>
            <div className="px-5 pb-6 pt-6 sm:px-7 sm:pb-8">
              <h1 className="display text-[clamp(2.5rem,7vw,3.25rem)]">
                {title}
              </h1>
              <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
                {description}
              </p>
              {children}
            </div>
            <div className="border-t border-rule-strong px-5 py-4 text-[15px] sm:px-7">
              {footer}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
