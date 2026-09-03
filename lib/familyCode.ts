import { prisma } from "./prisma";

const COLORS = [
  "Red", "Blue", "Green", "Purple", "Orange", "Yellow", "Teal", "Pink",
  "Gold", "Silver", "Maroon", "Navy", "Coral", "Indigo", "Amber", "Jade",
  "Ruby", "Violet", "Crimson", "Emerald", "Sapphire", "Copper", "Ivory",
  "Scarlet", "Turquoise", "Lavender", "Magenta", "Charcoal", "Rose", "Cyan",
];

// Picks the next unused "<Color> Family" code. If every color is taken,
// falls back to appending a number (e.g. "Red Family 2") so submissions
// never fail even in a very large year.
export async function generateFamilyCode(): Promise<string> {
  const existing = new Set(
    (await prisma.family.findMany({ select: { familyCode: true } })).map(
      (f) => f.familyCode
    )
  );

  for (const color of COLORS) {
    const code = `${color} Family`;
    if (!existing.has(code)) return code;
  }

  // All base colors used - start numbering.
  let n = 2;
  while (true) {
    for (const color of COLORS) {
      const code = `${color} Family ${n}`;
      if (!existing.has(code)) return code;
    }
    n++;
  }
}
