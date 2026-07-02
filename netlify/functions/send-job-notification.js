const twilio = require("twilio");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { techPhone, techName, jobId, address, date, time, serviceType, payout } = JSON.parse(event.body);

    if (!techPhone || !jobId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing techPhone or jobId" }) };
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const siteUrl = process.env.URL || "https://techportalspife.netlify.app";

    // TEMPORARY: using WhatsApp sandbox while A2P 10DLC SMS registration is pending.
    // Once A2P is approved, delete the two "whatsapp:" prefixes below and change
    // fromNumber back to process.env.TWILIO_PHONE_NUMBER to switch back to regular SMS.
    const useWhatsApp = true;
    const sandboxNumber = "+14155238886";
    const fromNumber = useWhatsApp ? `whatsapp:${sandboxNumber}` : process.env.TWILIO_PHONE_NUMBER;
    const toNumber = useWhatsApp ? `whatsapp:${techPhone}` : techPhone;

    const message = await client.messages.create({
      body:
        `Spife Clean: New job for you, ${techName || "there"}!\n` +
        `${serviceType || "Job"} - $${payout || "?"}\n` +
        `${date || ""} ${time || ""}\n` +
        `${address || ""}\n` +
        `Open the app to accept: ${siteUrl}`,
      from: fromNumber,
      to: toNumber,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sid: message.sid }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
