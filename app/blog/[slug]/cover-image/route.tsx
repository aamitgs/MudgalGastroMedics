import { NextResponse } from "next/server";

type CoverImageProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: CoverImageProps) {
  const { slug } = await params;
  return NextResponse.redirect(new URL(`/images/blog/generated/${slug}-cover.svg`, request.url));
}
