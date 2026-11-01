import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import CalendarEditor from "@/components/CalendarEditor";
import { Button } from "@/components/ui/button";
import { formatScheduleTerm } from "@/lib/scheduleFormat";
import type { Schedule } from "@/types";

type PublicSchedulePageProps = {
  params: Promise<{
    scheduleId: string;
  }>;
};

async function getPublicSchedule(scheduleId: string) {
  const headerStore = await headers();
  const host = headerStore.get("host");

  if (!host) {
    return null;
  }

  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const response = await fetch(
    `${protocol}://${host}/api/publicSchedule/${encodeURIComponent(
      scheduleId,
    )}`,
    { cache: "no-store" },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load public schedule");
  }

  const data = (await response.json()) as { schedule?: Schedule };
  return data.schedule ?? null;
}

export default async function PublicSchedulePage({
  params,
}: PublicSchedulePageProps) {
  const { scheduleId } = await params;
  const schedule = await getPublicSchedule(scheduleId);

  if (!schedule) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-desk text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 lg:px-8">
        <header className="flex flex-col gap-3 border-b-2 border-crimson pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/"
              className="font-black text-[24px] leading-none tracking-[-0.03em] text-crimson [font-stretch:125%]"
            >
              bldr
            </Link>
            <p className="form-label mt-4">Shared schedule · read-only copy</p>
            <h1 className="display mt-1 truncate text-[clamp(1.75rem,4vw,2.75rem)]">
              {schedule.name}
            </h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {formatScheduleTerm(schedule.semester, schedule.year)}
            </p>
          </div>
          <Button
            asChild
            className="h-11 w-fit rounded-none px-5 text-[16px] font-extrabold [font-stretch:92%]"
          >
            <Link href="/">Build your own schedule</Link>
          </Button>
        </header>

        <section className="min-h-[520px]">
          <CalendarEditor
            classes={schedule.classes}
            emptyMessage="This shared schedule does not have any classes yet."
            readOnly
            scheduleName={schedule.name}
          />
        </section>
      </div>
    </main>
  );
}
