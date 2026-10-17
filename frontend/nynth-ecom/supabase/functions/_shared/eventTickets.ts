// Mint event_tickets rows for a paid order. Called by paystack-webhook and
// paystack-verify after the order transition to paid is claimed, so a second
// finalizer cannot mint the codes twice.
//
// The order's jsonb codes stay the source of truth for the buyer's email. This
// table is the ledger the door reads: three separate statuses, an organizer and
// a commission, and one row per ticket.
export async function syncEventTickets(supabase: any, order: any, codes: any[]) {
  const items = Array.isArray(order.items) ? order.items : [];
  const customer = order.customer ?? {};
  const holderName = [customer.firstName, customer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || null;

  const rows = [];
  for (const code of codes ?? []) {
    const normalized = String(code?.code ?? "").trim().toUpperCase();
    if (!normalized) continue;

    // The ticket inherits its event's organizer and commission rate, so a sale
    // made before an appointment is appointed still lands in the right ledger.
    const productId = code?.productId ?? null;
    const item = items.find((i: any) => i?.id === productId) ?? null;
    let organizerStaffId: string | null = null;
    let commissionRate = 0;
    if (productId) {
      const { data: product } = await supabase
        .from("products")
        .select("data")
        .eq("id", productId)
        .maybeSingle();
      organizerStaffId = product?.data?.organizer_staff_id ?? null;
      commissionRate = Number(product?.data?.commission_rate ?? 0) || 0;
    }

    const amount = Number(code?.price ?? item?.price ?? 0) || 0;
    const commission = Math.round(amount * (commissionRate / 100) * 100) / 100;

    rows.push({
      id: `et-${crypto.randomUUID()}`,
      code: normalized,
      order_id: order.id,
      event_id: productId ?? "",
      event_title: code?.title ?? item?.name ?? null,
      event_date_time: code?.eventDateTime ?? item?.eventDateTime ?? null,
      venue: code?.venue ?? item?.venue ?? null,
      ticket_type: code?.type ?? code?.ticketType ?? null,
      holder_name: holderName,
      holder_email: customer.email ?? null,
      amount,
      payment_status: order.payment_status === "paid" ? "paid" : (order.payment_status ?? "pending"),
      // A ticket that was already admitted through the old jsonb path keeps that
      // history rather than being reset to unused.
      entry_status: code?.used === true ? "used" : "unused",
      verified_at: code?.used_at ?? null,
      commission_rate: commissionRate,
      nynth_commission: commission,
      organizer_share: Math.round((amount - commission) * 100) / 100,
      organizer_staff_id: organizerStaffId,
      is_test: order.is_test === true,
      created_at: order.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (rows.length === 0) return [];
  const { error } = await supabase.from("event_tickets").upsert(rows, { onConflict: "code", ignoreDuplicates: true });
  if (error) console.error("event_tickets mint failed", error);
  return rows;
}
