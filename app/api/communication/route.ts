import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { communicationChannels, communicationStatuses, communicationTemplates } from "@/lib/communication-types";
import type { CommunicationChannel, CommunicationStatus } from "@/lib/communication-types";
import { createCommunicationLog, getCommunicationRecipients, listCommunicationLogs, updateCommunicationLog } from "@/lib/communication-store";
import { queryCommunicationLogs, type CommunicationLogSortField, type SortDirection } from "@/lib/communication-log-query";
import { communicationCreateSchema, communicationUpdateSchema } from "@/lib/validation/operations";

const sortFields: CommunicationLogSortField[] = ["patientName", "channel", "status", "subject", "createdAt"];

export async function GET(request: Request) {
  const auth = await authorize(request, "liaison-notes", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const params = new URL(request.url).searchParams;
  const pageParam = params.get("page");
  const allLogs = await listCommunicationLogs();
  const recipients = await getCommunicationRecipients();

  // Backward compatible: existing callers that pass no pagination params
  // keep getting the full flat list they always got.
  if (pageParam === null) {
    return NextResponse.json({ ok: true, logs: allLogs, recipients, templates: communicationTemplates });
  }

  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const status = params.get("status");
  const channel = params.get("channel");

  const result = queryCommunicationLogs(allLogs, {
    page: Number(pageParam) || 0,
    pageSize: Number(params.get("pageSize")) || 25,
    sortBy: sortBy && sortFields.includes(sortBy as CommunicationLogSortField) ? (sortBy as CommunicationLogSortField) : undefined,
    sortDir: sortDir === "asc" || sortDir === "desc" ? (sortDir as SortDirection) : undefined,
    query: params.get("q") ?? undefined,
    status: status && communicationStatuses.includes(status as CommunicationStatus) ? (status as CommunicationStatus) : undefined,
    channel: channel && communicationChannels.includes(channel as CommunicationChannel) ? (channel as CommunicationChannel) : undefined
  });

  return NextResponse.json({ ok: true, ...result, recipients, templates: communicationTemplates });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "liaison-notes", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = communicationCreateSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : {};
  const channel = body.channel && communicationChannels.includes(body.channel as CommunicationChannel) ? body.channel : "WhatsApp";
  const status = body.status && communicationStatuses.includes(body.status as CommunicationStatus) ? body.status : "Draft";
  const result = (await createCommunicationLog({ ...body, channel, status }));
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, log: result.log });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "liaison-notes", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const parsed = communicationUpdateSchema.safeParse(await request.json().catch(() => ({})));
  const body = parsed.success ? parsed.data : { id: "" };
  const { id } = body;
  if (!id) return NextResponse.json({ ok: false, error: "Communication log id is required." }, { status: 400 });

  const status = body.status && communicationStatuses.includes(body.status as CommunicationStatus) ? (body.status as CommunicationStatus) : undefined;
  const channel = body.channel && communicationChannels.includes(body.channel as CommunicationChannel) ? (body.channel as CommunicationChannel) : undefined;
  const log = (await updateCommunicationLog({
    id,
    status,
    channel,
    subject: body.subject,
    message: body.message,
    scheduledFor: body.scheduledFor,
    owner: body.owner,
    notes: body.notes
  }));

  if (!log) return NextResponse.json({ ok: false, error: "Communication log not found." }, { status: 404 });
  return NextResponse.json({ ok: true, log });
}
