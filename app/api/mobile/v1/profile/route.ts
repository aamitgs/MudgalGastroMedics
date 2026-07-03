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
      phone: site.phone,
      mobile: site.mobile,
      whatsapp: site.whatsapp,
      email: site.email,
      directionsUrl: site.directionsUrl,
      mapEmbed: site.mapEmbed,
      businessHours: "Mon-Sat, 10 AM-6 PM",
      landmark: site.addressLine2,
      facilities: patientFacilities,
      highlights: whyChoose
    }
  });
}
