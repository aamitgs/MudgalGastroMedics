import { fullAddress, patientFacilities, site, whyChoose } from "@/lib/site-data";
import { hasMobileToken, mobileOk, mobileUnauthorized } from "@/lib/mobile-api";

export async function GET(request: Request) {
  if (!hasMobileToken(request)) return mobileUnauthorized();

  return mobileOk({
    hospital: {
      name: site.name,
      shortName: site.shortName,
      tagline: site.tagline,
      address: fullAddress,
      phone: site.mobile,
      mobile: site.mobile,
      whatsapp: site.whatsapp,
      email: site.email,
      directionsUrl: site.directionsUrl,
      mapEmbed: site.mapEmbed,
      businessHours: "OPD: Mon-Sat, Morning 11 AM-2 PM; Evening 5 PM-6 PM. Sunday closed. Hospital operates 24/7.",
      landmark: site.addressLine2,
      facilities: patientFacilities,
      highlights: whyChoose
    }
  });
}
