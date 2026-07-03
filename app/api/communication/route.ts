import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { communicationChannels, communicationStatuses, communicationTemplates } from "@/lib/communication-types";
import type { CommunicationChannel, CommunicationStatus } from "@/lib/communication-types";
import { createCommunicationLog, getCommunicationRecipients, listCommunicationLogs, updateCommunicationLog } from "@/lib/communication-store";

export async function GET(request: Request) {
  const auth = await authorize(request, "liaison-notes", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  return NextResponse.json({
    ok: true,
    logs: listCommunicationLogs(),
    recipients: getCommunicationRecipients(),
    templates: communicationTemplates
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request, "liaison-notes", "create");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const channel = typeof body.channel === "string" && communicationChannels.includes(body.channel as CommunicationChannel) ? body.channel : "WhatsApp";
  const status = typeof body.status === "string" && communicationStatuses.includes(body.status as CommunicationStatus) ? body.status : "Draft";
  const result = createCommunicationLog({ ...body, channel, status });
  if ("error" in result) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, log: result.log });
}

export async function PATCH(request: Request) {
  const auth = await authorize(request, "liaison-notes", "edit");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ ok: false, error: "Communication log id is required." }, { status: 400 });

  const status = typeof body.status === "string" && communicationStatuses.includes(body.status as CommunicationStatus) ? body.status as CommunicationStatus : undefined;
  const channel = typeof body.channel === "string" && communicationChannels.includes(body.channel as CommunicationChannel) ? body.channel as CommunicationChannel : undefined;
  const log = updateCommunicationLog({
    id,
    status,
    channel,
    subject: typeof body.subject === "string" ? body.subject : undefined,
    message: typeof body.message === "string" ? body.message : undefined,
    scheduledFor: typeof body.scheduledFor === "string" ? body.scheduledFor : undefined,
    owner: typeof body.owner === "string" ? body.owner : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined
  });

  if (!log) return NextResponse.json({ ok: false, error: "Communication log not found." }, { status: 404 });
  return NextResponse.json({ ok: true, log });
}
