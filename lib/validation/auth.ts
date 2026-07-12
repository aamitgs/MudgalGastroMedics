import { z } from "zod";

const genericLoginError = "Invalid username or password.";

// username is trimmed (matches original `.trim()`); password/role are left
// exactly as typed — trimming a password or role token would be a silent,
// surprising behavior change for callers that never asked for it.
// The { error } option on the base z.string() call (not just the chained
// .min() message) matters: it's what covers an entirely-absent key, since
// .min() alone only fires once the type check already passed.
export const authLoginSchema = z.object({
  username: z.string({ error: genericLoginError }).trim().min(1, genericLoginError),
  password: z.string({ error: genericLoginError }).min(1, genericLoginError),
  role: z.string().optional()
});

export const mfaCodeSchema = z.object({
  code: z.string().default("")
});

export const authPasswordChangeSchema = z.object({
  currentPassword: z.string().default(""),
  newPassword: z.string().default("")
});

export const authRoleSwitchSchema = z.object({
  role: z.string().default(""),
  password: z.string().default("")
});

const breakGlassReasonError = "A specific reason (at least 10 characters) is required — it will be reviewed.";

export const breakGlassRequestSchema = z.object({
  reason: z.string({ error: breakGlassReasonError }).trim().min(10, breakGlassReasonError)
});

export const adminSessionLoginSchema = z.object({
  passcode: z.string().default(""),
  username: z.string().default(""),
  password: z.string().default(""),
  staffId: z.string().default("STF-ADMIN-001")
});

export const doctorSessionLoginSchema = z.object({
  passcode: z.string().default("")
});

const accessRequiredFieldsError = "name, username and at least one role are required.";

export const accessUserCreateSchema = z.object({
  name: z.string({ error: accessRequiredFieldsError }).trim().min(1, accessRequiredFieldsError),
  username: z.string({ error: accessRequiredFieldsError }).min(1, accessRequiredFieldsError),
  email: z.string().trim().optional(),
  roles: z.array(z.string()).default([]),
  defaultRole: z.string().optional()
});

// id/operation stay lenient (default "", not min(1)): an empty id already
// falls through to the existing "User not found" 404 downstream, and an
// unrecognized operation already falls through to "Unknown operation." —
// forcing a 400 here would be a real behavior change, not just validation.
export const accessUserPatchSchema = z.object({
  id: z.string().default(""),
  operation: z.string().default(""),
  roles: z.array(z.string()).default([]),
  defaultRole: z.string().optional()
});

const approvalDecisionError = "id and decision (approved|rejected) are required.";

export const approvalDecisionSchema = z.object({
  id: z.string({ error: approvalDecisionError }).trim().min(1, approvalDecisionError),
  decision: z.enum(["approved", "rejected"], { error: approvalDecisionError })
});
