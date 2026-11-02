import { prisma } from "./prisma";

const SUBMISSIONS_KEY = "submissionsOpen";

// Defaults to open if nothing has been set yet (or the lookup fails), so a
// settings hiccup never accidentally locks families out of the form.
export async function getSubmissionsOpen(): Promise<boolean> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SUBMISSIONS_KEY } });
    return row ? row.value === "true" : true;
  } catch {
    return true;
  }
}

export async function setSubmissionsOpen(open: boolean) {
  await prisma.setting.upsert({
    where: { key: SUBMISSIONS_KEY },
    update: { value: String(open) },
    create: { key: SUBMISSIONS_KEY, value: String(open) },
  });
}
