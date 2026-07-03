import { hasMobileToken, mobileOk, mobileUnauthorized } from "@/lib/mobile-api";
import { getPublicProcedures } from "@/lib/cms-public";

export async function GET(request: Request) {
  if (!hasMobileToken(request)) return mobileUnauthorized();
  const procedures = getPublicProcedures();

  return mobileOk({
    procedures: procedures.map((procedure) => ({
      slug: procedure.slug,
      title: procedure.title,
      hiTitle: procedure.hiTitle,
      summary: procedure.summary,
      hiSummary: procedure.hiSummary,
      url: `/procedures/${procedure.slug}`
    }))
  });
}
