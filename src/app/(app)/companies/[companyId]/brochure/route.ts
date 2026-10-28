import { NextResponse, type NextRequest } from "next/server";
import { loadCompany } from "@/features/companies/load";
import { BROCHURE_BUCKET, brochureObjectPath } from "@/features/companies/schema";
import { requireUser } from "@/lib/auth/require-user";

const SIGNED_URL_SECONDS = 60;

/**
 * Sends the reader to a short-lived link for the brochure. Storage policy only
 * signs it for the owner and for people who can see the company.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  const { companyId } = await params;
  const { supabase } = await requireUser();

  const company = await loadCompany(supabase, companyId);
  if (!company?.brochure) {
    return new NextResponse("No brochure here.", { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(BROCHURE_BUCKET)
    .createSignedUrl(brochureObjectPath(company.userId, company.id), SIGNED_URL_SECONDS, {
      download: false,
    });

  if (error || !data) {
    return new NextResponse("The brochure could not be opened.", { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
