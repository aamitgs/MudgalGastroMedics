import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { listDocumentVersions } from "@/lib/patient-file-store";
import { firstZodIssueMessage } from "@/lib/validation/http";
import { documentVersionsQuerySchema } from "@/lib/validation/documents";

export async function GET(request: Request) {
  const auth = await authorize(request, "patients", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const parsed = documentVersionsQuerySchema.safeParse({ groupId: url.searchParams.get("groupId") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: firstZodIssueMessage(parsed.error) }, { status: 400 });
  }

  const versions = await listDocumentVersions(parsed.data.groupId);
  return NextResponse.json({ ok: true, versions });
}
