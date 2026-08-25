import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * Cover for the two routes into an IPD stay.
 *
 * The planned route starts from an OPD visit. The direct route exists because
 * tying every admission to a visit left an emergency — someone who never sat
 * in the queue — with no way to be admitted at all. Both are asserted against
 * the live API because that is where the rules live and where a UI change
 * cannot quietly bypass them.
 *
 * Every test seeds its own bed and patient with a run-unique identifier: the
 * IPD stores are not cleared between runs, so shared fixtures would make
 * results depend on run order.
 */

const RUN = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();

async function signIn(request: APIRequestContext) {
  const response = await request.post("/api/admin/session", { data: { username: "admin", password: "mgm-admin" } });
  expect(response.ok()).toBe(true);
}

type Admission = {
  id: string;
  admissionNo?: string;
  status: string;
  visitId: string;
  token: string;
  uhid?: string;
  patientId?: string;
  patientName: string;
  bedLabel: string;
  admissionType: string;
};

type IpdPayload = {
  ok: boolean;
  error?: string;
  admission?: Admission;
  alreadyAdmitted?: boolean;
  bed?: { id: string; label: string; status: string };
  beds?: { id: string; label: string; status: string }[];
  admissions?: Admission[];
  visits?: { id: string; status: string }[];
};

async function json(response: { json: () => Promise<unknown> }): Promise<IpdPayload> {
  return (await response.json()) as IpdPayload;
}

/** A bed nothing else in the run can claim, so vacancy is never a race. */
async function freshBed(request: APIRequestContext, label: string) {
  const created = await json(
    await request.post("/api/ipd", { data: { type: "bed", ward: "General", label, dailyRate: 1200 } })
  );
  expect(created.ok, created.error).toBe(true);
  return created.bed!;
}

test.beforeEach(async ({ request }) => {
  await signIn(request);
});

test.describe("direct admission", () => {
  test("admits an emergency with no OPD visit, filed under its register number", async ({ request }) => {
    const run = RUN();
    const bed = await freshBed(request, `Direct ${run}`);

    const result = await json(
      await request.post("/api/ipd", {
        data: {
          patientName: `E2E direct ${run}`,
          phone: `98${run.slice(0, 8).replace(/\D/g, "1").padEnd(8, "7")}`,
          age: "54",
          gender: "Male",
          bedId: bed.id,
          admissionType: "Emergency",
          diagnosis: "Acute GI bleed",
          consentRecorded: "true"
        }
      })
    );

    expect(result.ok, result.error).toBe(true);
    // No visit and no token: this stay never had a queue position. The
    // register number is what it is filed under instead, and a UHID is issued
    // so the patient is a real record from the first minute of the stay.
    expect(result.admission?.visitId).toBe("");
    expect(result.admission?.token).toBe("");
    expect(result.admission?.admissionNo).toMatch(/^IPD-\d{4}-\d{5}$/);
    expect(result.admission?.uhid).toBeTruthy();
    expect(result.admission?.patientId).toBeTruthy();
    expect(result.admission?.status).toBe("Admitted");
    expect(result.admission?.bedLabel).toBe(bed.label);
  });

  test("reuses the existing patient record when the phone already belongs to one", async ({ request }) => {
    const run = RUN();
    const phone = `9811${run.slice(0, 6).replace(/\D/g, "2").padEnd(6, "5")}`;

    const registered = await request.post("/api/patients", {
      data: { name: `E2E known ${run}`, phone, age: "61", gender: "Female" }
    });
    expect(registered.ok()).toBe(true);
    const knownUhid = ((await registered.json()) as { patient?: { uhid?: string } }).patient?.uhid;
    expect(knownUhid).toBeTruthy();

    const bed = await freshBed(request, `Known ${run}`);
    const result = await json(
      await request.post("/api/ipd", {
        data: { patientName: `E2E known ${run}`, phone, bedId: bed.id, diagnosis: "Known patient", consentRecorded: "true" }
      })
    );

    expect(result.ok, result.error).toBe(true);
    // The same person, not a second record with a second UHID — a duplicate
    // here would split their history across two charts mid-emergency.
    expect(result.admission?.uhid).toBe(knownUhid);
  });

  test("consent is still required — the direct route is not a way around it", async ({ request }) => {
    const run = RUN();
    const bed = await freshBed(request, `Consent ${run}`);

    const response = await request.post("/api/ipd", {
      data: { patientName: `E2E noconsent ${run}`, phone: `9813${run.slice(0, 6).replace(/\D/g, "3").padEnd(6, "4")}`, bedId: bed.id, diagnosis: "x" }
    });

    expect(response.status()).toBe(400);
    expect((await json(response)).error).toContain("consent");
  });

  test("a request identifying neither a visit nor a patient is refused", async ({ request }) => {
    const bed = await freshBed(request, `Neither ${RUN()}`);
    const response = await request.post("/api/ipd", { data: { bedId: bed.id, diagnosis: "x", consentRecorded: "true" } });

    expect(response.status()).toBe(400);
    expect((await json(response)).error).toContain("direct admission");
  });
});

test.describe("one patient, one bed", () => {
  test("a patient already admitted is not admitted twice, and the second bed stays free", async ({ request }) => {
    const run = RUN();
    const phone = `9814${run.slice(0, 6).replace(/\D/g, "6").padEnd(6, "8")}`;
    const firstBed = await freshBed(request, `Dup A ${run}`);

    const first = await json(
      await request.post("/api/ipd", {
        data: { patientName: `E2E dup ${run}`, phone, bedId: firstBed.id, diagnosis: "First stay", consentRecorded: "true" }
      })
    );
    expect(first.ok, first.error).toBe(true);

    const secondBed = await freshBed(request, `Dup B ${run}`);
    const second = await json(
      await request.post("/api/ipd", {
        data: { patientName: `E2E dup ${run}`, phone, bedId: secondBed.id, diagnosis: "Second stay", consentRecorded: "true" }
      })
    );

    // Idempotent, and honest about it: the caller is told nothing was created
    // rather than being handed a fresh-looking admission.
    expect(second.ok).toBe(true);
    expect(second.alreadyAdmitted).toBe(true);
    expect(second.admission?.id).toBe(first.admission?.id);

    // The decisive part — two beds and two bills for one person is the actual
    // damage this guard prevents.
    const board = await json(await request.get("/api/ipd"));
    expect(board.beds?.find((entry) => entry.id === secondBed.id)?.status).toBe("Vacant");
  });
});

test.describe("the OPD-visit route is unchanged", () => {
  test("admits from a visit, carrying its token, and still rejects an unknown visit", async ({ request }) => {
    const run = RUN();
    const walkIn = await request.post("/api/opd", {
      data: { patientName: `E2E visit ${run}`, phone: `9815${run.slice(0, 6).replace(/\D/g, "7").padEnd(6, "9")}`, service: "OPD", priority: "Routine" }
    });
    expect(walkIn.ok()).toBe(true);
    const visit = ((await walkIn.json()) as { visit: { id: string; token: string } }).visit;

    const bed = await freshBed(request, `Visit ${run}`);
    const result = await json(
      await request.post("/api/ipd", {
        data: { visitId: visit.id, bedId: bed.id, diagnosis: "Post consultation", consentRecorded: "true" }
      })
    );

    expect(result.ok, result.error).toBe(true);
    expect(result.admission?.visitId).toBe(visit.id);
    expect(result.admission?.token).toBe(visit.token);

    const unknown = await request.post("/api/ipd", {
      data: { visitId: "OPD-does-not-exist", bedId: bed.id, diagnosis: "x", consentRecorded: "true" }
    });
    expect(unknown.status()).toBe(400);
    expect((await json(unknown)).error).toContain("OPD visit not found");
  });
});
