exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { jobId, amount, customerEmail, description } = JSON.parse(event.body);

    if (!jobId || !amount) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing jobId or amount" }) };
    }

    const siteUrl = process.env.URL || "https://techportalspife.netlify.app";

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", `${siteUrl}/book?paid=success`);
    params.append("cancel_url", `${siteUrl}/book?paid=cancelled`);
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", description || `Spife Clean job ${jobId}`);
    params.append("line_items[0][price_data][unit_amount]", Math.round(parseFloat(amount) * 100).toString());
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[jobId]", jobId);
    if (customerEmail) params.append("customer_email", customerEmail);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error?.message || "Stripe error" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ url: data.url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
