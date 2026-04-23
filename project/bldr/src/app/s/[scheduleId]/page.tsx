import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import CalendarEditor from "@/components/CalendarEditor";
import { Button } from "@/components/ui/button";
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
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link href="/" className="font-dmsans text-lg font-bold">
              <span className="text-white">b</span>
              <span className="text-red-500">l</span>
              <span className="text-blue-600">d</span>
              <span className="text-yellow-300">r</span>
            </Link>
            <h1 className="mt-2 truncate font-figtree text-2xl font-semibold lg:text-3xl">
              {schedule.name}
            </h1>
            <p className="font-inter text-sm text-[#A8A8A8]">
              {schedule.semester} {schedule.year}
            </p>
          </div>
          <Button asChild className="w-fit font-dmsans">
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
