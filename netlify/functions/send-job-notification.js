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

    const message = await client.messages.create({
      body:
        `Spife Clean: New job for you, ${techName || "there"}!\n` +
        `${serviceType || "Job"} - $${payout || "?"}\n` +
        `${date || ""} ${time || ""}\n` +
        `${address || ""}\n` +
        `Open the app to accept: ${siteUrl}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: techPhone,
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
