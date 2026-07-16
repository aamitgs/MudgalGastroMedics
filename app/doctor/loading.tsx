import { ModuleSkeleton } from "@/components/design-system/ModuleSkeleton";

export default function Loading() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-surface">
      <div className="mx-auto w-[min(1560px,calc(100%-32px))] py-5">
        <ModuleSkeleton tiles={4} rows={5} />
      </div>
    </main>
  );
}
