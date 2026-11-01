import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-desk px-4 py-12 text-foreground">
      <div className="relative w-full max-w-[34rem]">
        <div className="border-2 border-crimson bg-card">
          <div className="flex items-center justify-between gap-3 border-b-2 border-crimson px-5 py-2.5 sm:px-7">
            <p className="form-label">Returned to sender</p>
            <p className="form-label">Error 404</p>
          </div>
          <div className="px-5 py-7 sm:px-7 sm:py-9">
            <h1 className="display text-[clamp(2.5rem,8vw,3.75rem)]">
              This page isn&apos;t on file.
            </h1>
            <p className="mt-4 max-w-[40ch] text-[16px] leading-relaxed text-muted-foreground">
              The link may be old, or the schedule may no longer be shared.
              Check the address, or head somewhere we know exists.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/builder"
                className="inline-flex h-12 items-center justify-center gap-2 bg-primary px-5 text-[17px] font-extrabold text-primary-foreground [font-stretch:92%] hover:bg-primary/90"
              >
                Open the builder
                <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center border-2 border-crimson px-5 text-[17px] font-extrabold text-crimson [font-stretch:92%] hover:bg-accent"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
        <div
          aria-hidden
          className="absolute -bottom-5 right-6 rotate-[-7deg] border-[3px] border-crimson bg-card/40 px-3 py-1 text-[22px] font-black uppercase leading-none text-crimson opacity-90 [font-stretch:120%]"
        >
          Not found
        </div>
      </div>
    </div>
  );
}
