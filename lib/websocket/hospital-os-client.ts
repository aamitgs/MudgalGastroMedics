import type { HospitalRealtimeEvent } from "@/lib/hospital-os-data";

type HospitalRealtimeOptions = {
  /** Real WebSocket gateway URL, e.g. from an env var set only on self-hosted deployments. Omit to poll only. */
  url?: string;
  pollingUrl: string;
  pollingMs?: number;
  onEvent: (event: HospitalRealtimeEvent) => void;
  onStatus?: (status: "connecting" | "connected" | "polling" | "closed") => void;
};

type PollResponse = {
  ok: boolean;
  events?: HospitalRealtimeEvent[];
  nextCursor?: number;
};

export function createHospitalRealtimeClient({ url, pollingUrl, pollingMs = 8000, onEvent, onStatus }: HospitalRealtimeOptions) {
  let socket: WebSocket | null = null;
  let pollingId: number | null = null;
  let cursor = Date.now() - 5 * 60 * 1000;

  async function pollOnce() {
    const separator = pollingUrl.includes("?") ? "&" : "?";
    const response = await fetch(`${pollingUrl}${separator}since=${cursor}`, { cache: "no-store" });
    const data = await response.json().catch(() => ({})) as PollResponse;
    if (!response.ok || !data.ok) return;
    cursor = data.nextCursor ?? cursor;
    for (const event of data.events ?? []) onEvent(event);
  }

  function startPolling() {
    if (pollingId) return;
    onStatus?.("polling");
    void pollOnce();
    pollingId = window.setInterval(() => {
      void pollOnce();
    }, pollingMs);
  }

  function connect() {
    onStatus?.("connecting");
    if (!url || !("WebSocket" in window)) {
      startPolling();
      return;
    }

    try {
      socket = new WebSocket(url);
      socket.addEventListener("open", () => onStatus?.("connected"));
      socket.addEventListener("message", (message) => {
        const event = JSON.parse(String(message.data)) as HospitalRealtimeEvent;
        onEvent(event);
      });
      socket.addEventListener("close", () => startPolling());
      socket.addEventListener("error", () => startPolling());
    } catch {
      startPolling();
    }
  }

  function disconnect() {
    socket?.close();
    socket = null;
    if (pollingId) window.clearInterval(pollingId);
    pollingId = null;
    onStatus?.("closed");
  }

  return { connect, disconnect };
}
