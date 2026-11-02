import { NextRequest, NextResponse } from "next/server";
import { getSubmissionsOpen, setSubmissionsOpen } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ submissionsOpen: await getSubmissionsOpen() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (typeof body.submissionsOpen !== "boolean") {
    return NextResponse.json({ error: "submissionsOpen must be true or false." }, { status: 400 });
  }
  await setSubmissionsOpen(body.submissionsOpen);
  return NextResponse.json({ submissionsOpen: body.submissionsOpen });
}
