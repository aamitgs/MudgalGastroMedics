import { mobileApiVersion } from "@/lib/mobile-api";

export async function GET() {
  return Response.json({
    openapi: "3.1.0",
    info: {
      title: "Mudgal Gastromedics Mobile API",
      version: mobileApiVersion,
      description: "Token-gated API contract for future patient, staff and mobile app clients."
    },
    security: [{ bearerAuth: [] }, { mobileToken: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
        mobileToken: { type: "apiKey", in: "header", name: "x-mobile-token" }
      }
    },
    paths: {
      "/api/mobile/v1/profile": {
        get: {
          summary: "Hospital profile, contact, location and facilities",
          security: [{ bearerAuth: [] }, { mobileToken: [] }]
        }
      },
      "/api/mobile/v1/procedures": {
        get: {
          summary: "Public procedure catalog for mobile screens",
          security: [{ bearerAuth: [] }, { mobileToken: [] }]
        }
      },
      "/api/mobile/v1/patient": {
        post: {
          summary: "Patient lookup with appointments and OPD visit summaries",
          security: [{ bearerAuth: [] }, { mobileToken: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["phone"],
                  properties: {
                    phone: { type: "string" },
                    requestId: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
}
