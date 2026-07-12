import { z } from "zod";

const genericPatientLoginError = "Invalid email or password.";

export const patientLoginSchema = z.object({
  email: z.string().trim().min(1, genericPatientLoginError),
  password: z.string().min(1, genericPatientLoginError)
});

// `.includes("@")` (not `.email()`) matches the original loose check exactly —
// a stricter format rule here would reject inputs the app has always accepted.
export const magicLinkRequestSchema = z.object({
  email: z.string().trim().default("")
});

export const magicLinkVerifySchema = z.object({
  token: z.string().trim().min(1, "Sign-in token is required.")
});

export const otpRequestSchema = z.object({
  phone: z.string().default("")
});

export const otpVerifySchema = z.object({
  phone: z.string().default(""),
  code: z.string().default("")
});

export const patientProfileUpdateSchema = z.object({
  email: z.string().trim().toLowerCase().default(""),
  password: z.string().default("")
});

// name stays a lenient default (not min(1)): an entirely-absent field would
// otherwise surface Zod's raw "expected string, received undefined" instead
// of the friendly message — addFamilyMember's own `!name` check already
// owns "required" for both the absent and empty-string cases uniformly.
export const familyMemberCreateSchema = z.object({
  name: z.string().trim().default(""),
  relation: z.string().default(""),
  age: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

// id stays lenient (default "", not min(1)): an empty id already falls
// through to the existing "Family member not found" 404, matching current behavior.
export const familyMemberDeleteSchema = z.object({
  id: z.string().default("")
});

export const patientRecordsLookupSchema = z.object({
  requestId: z.string().trim().default("")
});
