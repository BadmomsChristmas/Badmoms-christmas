import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFamilyCode } from "@/lib/familyCode";

type ChildInput = {
  firstName: string;
  gender: string;
  age: number;
  clothingSize: string;
  shoeSize: string;
  clothingNeeds?: string;
  wishlist1: string;
  wishlist2: string;
  wishlist3: string;
  additionalComments?: string;
};

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    momName,
    momPhone,
    momEmail,
    householdNeeds,
    wantsDinner,
    wantsWrappingPaper,
    acknowledgedSponsoredElsewhere,
    children,
  } = body;

  if (!momName || !momPhone || !momEmail) {
    return NextResponse.json(
      { error: "Name, phone, and email are required." },
      { status: 400 }
    );
  }

  if (!acknowledgedSponsoredElsewhere) {
    return NextResponse.json(
      { error: "You must acknowledge the sponsorship notification requirement." },
      { status: 400 }
    );
  }

  if (!Array.isArray(children) || children.length === 0) {
    return NextResponse.json(
      { error: "At least one child is required." },
      { status: 400 }
    );
  }

  for (const c of children as ChildInput[]) {
    if (
      !c.firstName ||
      !c.gender ||
      !c.age ||
      !c.clothingSize ||
      !c.shoeSize ||
      !c.wishlist1 ||
      !c.wishlist2 ||
      !c.wishlist3
    ) {
      return NextResponse.json(
        { error: "Please fill out all required fields for each child." },
        { status: 400 }
      );
    }
  }

  const familyCode = await generateFamilyCode();

  const family = await prisma.family.create({
    data: {
      familyCode,
      momName,
      momPhone,
      momEmail,
      householdNeeds: householdNeeds || null,
      wantsDinner: Boolean(wantsDinner),
      wantsWrappingPaper: Boolean(wantsWrappingPaper),
      acknowledgedSponsoredElsewhere: true,
      children: {
        create: (children as ChildInput[]).map((c) => ({
          firstName: c.firstName,
          gender: c.gender,
          age: c.age,
          clothingSize: c.clothingSize,
          shoeSize: c.shoeSize,
          clothingNeeds: c.clothingNeeds || null,
          wishlist1: c.wishlist1,
          wishlist2: c.wishlist2,
          wishlist3: c.wishlist3,
          additionalComments: c.additionalComments || null,
        })),
      },
    },
    include: { children: true },
  });

  return NextResponse.json({ familyCode: family.familyCode }, { status: 201 });
}
