import { NextResponse } from "next/server";
import { authorize } from "@/lib/access/guard";
import { checkDatabaseHealth, checkSchemaHealth, shouldUseDatabaseStores } from "@/lib/database";

export async function GET(request: Request) {
  const auth = await authorize(request, "system-settings", "view");
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const [connection, schema] = await Promise.all([
    checkDatabaseHealth(),
    checkSchemaHealth()
  ]);

  return NextResponse.json({
    ok: connection.ok && schema.ok,
    dataSource: shouldUseDatabaseStores() ? "database" : "local-json",
    connection,
    schema
  });
}
