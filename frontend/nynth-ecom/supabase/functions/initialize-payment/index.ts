// initialize-payment — min 100 NGN, returns authorization_url + reference.
Deno.serve(async (req) => {
  const { amount, email, metadata } = await req.json().catch(() => ({}));
  if (!amount || !email) return Response.json({ error: "amount + email required" }, { status: 400 });
  if (Number(amount) < 100) return Response.json({ error: "Minimum \u20A6100" }, { status: 400 });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  const callbackPath = (req.headers.get("origin") || "https://nynth.com") + "/thank-you" + (metadata?.orderId ? "?orderId=" + encodeURIComponent(metadata.orderId) : "");
  const res = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" }, body: JSON.stringify({ amount: Math.round(Number(amount) * 100), email, metadata, callback_url: callbackPath }) });
  const body = await res.json();
  if (!body.status) return Response.json({ error: body.message ?? "init failed" }, { status: 400 });
  return Response.json({ authorization_url: body.data.authorization_url, reference: body.data.reference });
});
