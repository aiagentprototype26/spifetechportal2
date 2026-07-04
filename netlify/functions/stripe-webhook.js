const crypto = require("crypto");

function verifyStripeSignature(payload, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const parts = sigHeader.split(",").reduce((acc, part) => {
    const [k, v] = part.split("=");
    acc[k] = v;
    return acc;
  }, {});
  const signedPayload = `${parts.t}.${payload}`;
  const expectedSig = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return expectedSig === parts.v1;
}

exports.handler = async function (event) {
  const sig = event.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!verifyStripeSignature(event.body, sig, secret)) {
    return { statusCode: 400, body: "Invalid signature" };
  }

  const stripeEvent = JSON.parse(event.body);

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const jobId = session.metadata && session.metadata.jobId;

    if (jobId) {
      const projectId = "spifeclean-e1def";
      const apiKey = process.env.FIREBASE_API_KEY;
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/jobs/${jobId}?updateMask.fieldPaths=paymentStatus&key=${apiKey}`;

      await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { paymentStatus: { stringValue: "paid" } } }),
      });
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
