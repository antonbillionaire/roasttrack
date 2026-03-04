import { supabaseAdmin } from "./supabase";

interface User {
  id: string;
  email: string;
  access_token: string;
  credits_remaining: number;
  total_credits_purchased: number;
  total_spent_cents: number;
}

// Find or create user by email
export async function getOrCreateUser(email: string): Promise<User> {
  const normalized = email.toLowerCase().trim();

  // Try to find existing
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", normalized)
    .single();

  if (existing) return existing as User;

  // Create new
  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert({ email: normalized })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return created as User;
}

// Get user by access token (for /my page)
export async function getUserByToken(token: string): Promise<User | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("access_token", token)
    .single();

  return data as User | null;
}

// Add credits after purchase
export async function addCredits(
  email: string,
  credits: number,
  amountCents: number,
  polarOrderId: string,
  packType: string
): Promise<User> {
  const user = await getOrCreateUser(email);

  // Check idempotency — don't double-process same order
  const { data: existingPurchase } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("polar_order_id", polarOrderId)
    .single();

  if (existingPurchase) return user; // Already processed

  // Record purchase
  const { error: purchaseErr } = await supabaseAdmin
    .from("purchases")
    .insert({
      user_id: user.id,
      polar_order_id: polarOrderId,
      pack_type: packType,
      credits,
      amount_cents: amountCents,
    });

  if (purchaseErr) throw new Error(`Failed to record purchase: ${purchaseErr.message}`);

  // Update user credits
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("users")
    .update({
      credits_remaining: user.credits_remaining + credits,
      total_credits_purchased: user.total_credits_purchased + credits,
      total_spent_cents: user.total_spent_cents + amountCents,
    })
    .eq("id", user.id)
    .select()
    .single();

  if (updateErr) throw new Error(`Failed to update credits: ${updateErr.message}`);
  return updated as User;
}

// Deduct 1 credit for track generation
export async function deductCredit(userId: string): Promise<boolean> {
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("credits_remaining")
    .eq("id", userId)
    .single();

  if (!user || user.credits_remaining < 1) return false;

  const { error } = await supabaseAdmin
    .from("users")
    .update({ credits_remaining: user.credits_remaining - 1 })
    .eq("id", userId)
    .eq("credits_remaining", user.credits_remaining); // optimistic lock

  return !error;
}

// Record a generation
export async function recordGeneration(
  userId: string | null,
  trackId: string,
  name: string,
  genre: string,
  roastLevel: string,
  language: string,
  isFreePreview: boolean
) {
  await supabaseAdmin.from("generations").insert({
    user_id: userId,
    track_id: trackId,
    name,
    genre,
    roast_level: roastLevel,
    language,
    is_free_preview: isFreePreview,
  });
}

// Get user's generation history
export async function getUserGenerations(userId: string) {
  const { data } = await supabaseAdmin
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

// Check if IP/fingerprint already used free preview (simple rate limit)
export async function countFreePreviewsToday(ip: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("is_free_preview", true)
    .gte("created_at", today.toISOString());

  return count || 0;
}
