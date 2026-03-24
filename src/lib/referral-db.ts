import { getSql } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
function asRows(result: unknown): Row[] {
  return Array.isArray(result) ? result : [];
}

const REFERRER_XP = 500;
const REFEREE_XP = 200;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generate a unique 8-char alphanumeric code (no ambiguous chars) */
function generateCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/** Get or create a referral code for a user */
export async function getOrCreateReferralCode(
  userId: number
): Promise<string> {
  const sql = getSql();

  // Check if user already has a code
  const existing = asRows(
    await sql`SELECT code FROM referral_codes WHERE user_id = ${userId}`);
  if (existing.length > 0) {
    return existing[0].code;
  }

  // Generate a unique code, retrying on collision
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    try {
      await sql`INSERT INTO referral_codes (user_id, code) VALUES (${userId}, ${code})`;
      return code;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err);
      // Unique violation on code — retry with a new code
      if (message.includes("unique") || message.includes("duplicate")) {
        continue;
      }
      // Unique violation on user_id — another request created it concurrently
      if (message.includes("referral_codes_user_id_key")) {
        const row = asRows(
          await sql`SELECT code FROM referral_codes WHERE user_id = ${userId}`);
        return row[0].code;
      }
      throw err;
    }
  }

  throw new Error("Failed to generate a unique referral code after 10 attempts");
}

/**
 * Claim a referral code.
 * Validates: code exists, user hasn't already claimed, user isn't claiming own code.
 * Awards REFERRER_XP to the referrer and REFEREE_XP to the referee.
 */
export async function claimReferralCode(
  refereeId: number,
  code: string
): Promise<{
  success: boolean;
  message: string;
  referrerXp?: number;
  refereeXp?: number;
}> {
  const sql = getSql();

  // 1. Look up the referral code
  const codeRows = asRows(
    await sql`SELECT user_id FROM referral_codes WHERE code = ${code.toUpperCase()}`);
  if (codeRows.length === 0) {
    return { success: false, message: "Invalid referral code." };
  }

  const referrerId: number = codeRows[0].user_id;

  // 2. Can't claim your own code
  if (referrerId === refereeId) {
    return { success: false, message: "You cannot use your own referral code." };
  }

  // 3. Check if referee already claimed any code
  const existingClaim = asRows(
    await sql`SELECT id FROM referral_claims WHERE referee_id = ${refereeId}`);
  if (existingClaim.length > 0) {
    return {
      success: false,
      message: "You have already used a referral code.",
    };
  }

  // 4. Insert the claim
  try {
    await sql`INSERT INTO referral_claims (referrer_id, referee_id, xp_awarded) VALUES (${referrerId}, ${refereeId}, ${REFERRER_XP})`;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("unique") || message.includes("duplicate")) {
      return {
        success: false,
        message: "You have already used a referral code.",
      };
    }
    throw err;
  }

  // 5. Upsert XP for the referrer (+REFERRER_XP, +1 referral count)
  await sql`
    INSERT INTO referral_xp (user_id, xp, referral_count, updated_at)
    VALUES (${referrerId}, ${REFERRER_XP}, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET xp = referral_xp.xp + ${REFERRER_XP},
        referral_count = referral_xp.referral_count + 1,
        updated_at = NOW()
  `;

  // 6. Upsert XP for the referee (+REFEREE_XP)
  await sql`
    INSERT INTO referral_xp (user_id, xp, referral_count, updated_at)
    VALUES (${refereeId}, ${REFEREE_XP}, 0, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET xp = referral_xp.xp + ${REFEREE_XP},
        updated_at = NOW()
  `;

  // 7. Fetch updated totals
  const referrerStats = asRows(
    await sql`SELECT xp FROM referral_xp WHERE user_id = ${referrerId}`);
  const refereeStats = asRows(
    await sql`SELECT xp FROM referral_xp WHERE user_id = ${refereeId}`);

  return {
    success: true,
    message: "Referral code claimed successfully!",
    referrerXp: referrerStats[0]?.xp ?? REFERRER_XP,
    refereeXp: refereeStats[0]?.xp ?? REFEREE_XP,
  };
}

/** Get referral stats for a user: xp, rank, referralCount, referralCode */
export async function getUserReferralStats(userId: number): Promise<{
  xp: number;
  rank: number;
  referralCount: number;
  referralCode: string;
}> {
  const sql = getSql();

  // Ensure the user has a referral code
  const referralCode = await getOrCreateReferralCode(userId);

  // Get XP row (may not exist yet)
  const xpRows = asRows(
    await sql`SELECT xp, referral_count FROM referral_xp WHERE user_id = ${userId}`);

  const xp: number = xpRows.length > 0 ? xpRows[0].xp : 0;
  const referralCount: number =
    xpRows.length > 0 ? xpRows[0].referral_count : 0;

  // Calculate rank
  const rankRows = asRows(await sql`
    SELECT COUNT(*) + 1 AS rank
    FROM referral_xp
    WHERE xp > (SELECT COALESCE(xp, 0) FROM referral_xp WHERE user_id = ${userId})
  `);
  const rank: number = rankRows.length > 0 ? Number(rankRows[0].rank) : 1;

  return { xp, rank, referralCount, referralCode };
}

/** Get leaderboard: top N users by XP */
export async function getLeaderboard(
  limit: number = 20
): Promise<
  Array<{
    rank: number;
    userId: number;
    xp: number;
    referralCount: number;
  }>
> {
  const sql = getSql();

  const rows = asRows(await sql`
    SELECT user_id, xp, referral_count
    FROM referral_xp
    WHERE xp > 0
    ORDER BY xp DESC, updated_at ASC
    LIMIT ${limit}
  `);

  return rows.map((row: Row, index: number) => ({
    rank: index + 1,
    userId: row.user_id,
    xp: row.xp,
    referralCount: row.referral_count,
  }));
}
