const twilio = require("twilio");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { customerName, address, date, time, serviceType, description } = JSON.parse(event.body);

    if (!customerName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing customerName" }) };
    }

    if (!process.env.DISPATCHER_PHONE) {
      return { statusCode: 500, body: JSON.stringify({ error: "DISPATCHER_PHONE env var not set" }) };
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const siteUrl = process.env.URL || "https://spifecleaner.netlify.app";

    // TEMPORARY: using WhatsApp sandbox while A2P 10DLC SMS registration is pending.
    // Once A2P is approved, delete the two "whatsapp:" prefixes below and change
    // fromNumber back to process.env.TWILIO_PHONE_NUMBER to switch back to regular SMS.
    const useWhatsApp = true;
    const sandboxNumber = "+14155238886";
    const fromNumber = useWhatsApp ? `whatsapp:${sandboxNumber}` : process.env.TWILIO_PHONE_NUMBER;
    const toNumber = useWhatsApp ? `whatsapp:${process.env.DISPATCHER_PHONE}` : process.env.DISPATCHER_PHONE;

    const message = await client.messages.create({
      body:
        `Spife Clean: New booking request from ${customerName}!\n` +
        `${serviceType || "Service"}\n` +
        `${date || ""} ${time || ""}\n` +
        `${address || ""}\n` +
        `${description ? `Notes: ${description}\n` : ""}` +
        `Set a price and assign a tech: ${siteUrl}/dispatch`,
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
