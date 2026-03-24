// Verifies the user's JWT by calling the backend /me endpoint
// Returns the user profile or null
export async function verifyUser(
  req: Request
): Promise<{ user_id: number; username: string | null } | null> {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "https://api2.heyanna.trade";
    const res = await fetch(`${baseUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user_id
      ? { user_id: data.user_id, username: data.username ?? null }
      : null;
  } catch {
    return null;
  }
}
