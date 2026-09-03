import { Resend } from "resend";
import { config } from "./config";

// Lazily construct the client so the app doesn't crash at import time if
// RESEND_API_KEY isn't set yet (e.g. while you're still building locally).
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(
      "RESEND_API_KEY is not set - emails will be logged instead of sent."
    );
    return null;
  }
  return new Resend(key);
}

async function send(to: string, subject: string, html: string) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM || "Bad Moms Christmas <no-reply@example.org>";

  if (!resend) {
    console.log(`[email suppressed - no API key] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (err) {
    // Email failures should never break the underlying claim/submission flow.
    console.error("Failed to send email:", err);
  }
}

const wrapper = (body: string) => `
  <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #222;">
    <h2 style="color: #9e2b25;">${config.orgName}</h2>
    ${body}
    <p style="margin-top: 32px; font-size: 12px; color: #888;">
      This is an automated message from ${config.orgName}.
    </p>
  </div>
`;

export type SponsoredChildDetail = {
  familyCode: string;
  firstName: string;
  submissionNumber: number;
  age: number;
  gender: string;
  clothingSize: string;
  shoeSize: string;
  clothingNeeds?: string | null;
  wishlist1: string;
  wishlist2: string;
  wishlist3: string;
  additionalComments?: string | null;
  householdNeeds?: string | null;
};

function childDetailBlock(c: SponsoredChildDetail) {
  return `
    <div style="border: 1px solid #e0dccd; border-radius: 4px; padding: 14px 18px; margin-bottom: 14px;">
      <p style="margin: 0 0 6px; font-weight: bold; font-size: 1.05em;">
        ${c.firstName} (#${c.submissionNumber}) - ${c.familyCode}
      </p>
      <p style="margin: 0 0 6px; color: #555;">
        ${c.gender}, age ${c.age} &middot; clothing size ${c.clothingSize} &middot; shoe size ${c.shoeSize}
        ${c.clothingNeeds ? ` &middot; ${c.clothingNeeds}` : ""}
      </p>
      <p style="margin: 0 0 4px; font-weight: bold;">Wishlist:</p>
      <ul style="margin: 0 0 6px;">
        <li>${c.wishlist1}</li>
        <li>${c.wishlist2}</li>
        <li>${c.wishlist3}</li>
      </ul>
      ${c.additionalComments ? `<p style="margin: 0 0 6px; color: #555;">Additional notes: ${c.additionalComments}</p>` : ""}
      ${c.householdNeeds ? `<p style="margin: 0; color: #555;">Household needs: ${c.householdNeeds}</p>` : ""}
    </div>
  `;
}

export async function sendSponsorClaimConfirmation(opts: {
  to: string;
  sponsorName: string;
  children: SponsoredChildDetail[];
}) {
  const blocks = opts.children.map(childDetailBlock).join("");
  await send(
    opts.to,
    `You're confirmed! Thank you for sponsoring with ${config.orgName}`,
    wrapper(`
      <p>Hi ${opts.sponsorName},</p>
      <p>Thank you so much for claiming the following this year - here's everything you need to shop:</p>
      ${blocks}
      <p>
        <strong>Drop-off:</strong> ${config.dropoffDate}, ${config.dropoffWindow}
        at ${config.dropoffLocation}.
      </p>
      <p>We'll send you a reminder as the date gets closer. Thank you for making Christmas brighter for a family this year!</p>
    `)
  );
}

export async function sendSponsorDropoffReminder(opts: {
  to: string;
  sponsorName: string;
  children: SponsoredChildDetail[];
}) {
  const blocks = opts.children.map(childDetailBlock).join("");
  await send(
    opts.to,
    `Reminder: Drop-off is coming up - ${config.orgName}`,
    wrapper(`
      <p>Hi ${opts.sponsorName},</p>
      <p>Just a friendly reminder that drop-off for your sponsored child/children is coming up. Here's a recap in case you still need it while finishing up shopping:</p>
      ${blocks}
      <p>
        <strong>Drop-off:</strong> ${config.dropoffDate}, ${config.dropoffWindow}
        at ${config.dropoffLocation}.
      </p>
      <p>Thank you again for your generosity!</p>
    `)
  );
}

export async function sendMomFullySponsoredNotice(opts: {
  to: string;
  familyCode: string;
}) {
  await send(
    opts.to,
    `Your family has been fully sponsored! - ${config.orgName}`,
    wrapper(`
      <p>Hi there,</p>
      <p>Great news - your family (${opts.familyCode}) has been fully sponsored this year!</p>
      <p>
        <strong>Pickup:</strong> ${config.dropoffDate}, ${config.pickupWindow}
        at ${config.dropoffLocation}.
      </p>
      <p>We'll send a reminder as the date gets closer. Thank you for being part of our community.</p>
    `)
  );
}

export async function sendMomPickupReminder(opts: {
  to: string;
  familyCode: string;
}) {
  await send(
    opts.to,
    `Reminder: Pickup is coming up - ${config.orgName}`,
    wrapper(`
      <p>Hi there,</p>
      <p>Just a reminder that pickup for your family (${opts.familyCode}) is coming up:</p>
      <p>
        <strong>Pickup:</strong> ${config.dropoffDate}, ${config.pickupWindow}
        at ${config.dropoffLocation}.
      </p>
      <p>We look forward to seeing you!</p>
    `)
  );
}