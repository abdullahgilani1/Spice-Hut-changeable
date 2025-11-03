/**
 * Lightweight Twilio SMS helper. Non-blocking: if Twilio env vars are missing
 * this module will log a warning and resolve without throwing so it doesn't
 * break existing flows.
 */
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = process.env.TWILIO_FROM_NUMBER;

let client = null;
if (twilioAccountSid && twilioAuthToken) {
  try {
    // lazy require to avoid optional dependency failures in environments
    // where Twilio is not installed or not configured.
    const twilio = require('twilio');
    client = twilio(twilioAccountSid, twilioAuthToken);
  } catch (err) {
    console.warn('[sms] Twilio package not available', err && err.message);
    client = null;
  }
} else {
  // Not configured — we will not attempt to send SMS
}

const sendSms = async (to, body) => {
  try {
    if (!client || !twilioFrom) {
      console.warn('[sms] Twilio not configured, skipping SMS send to', to);
      return { success: false, message: 'Twilio not configured' };
    }
    const msg = await client.messages.create({ body, from: twilioFrom, to });
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.warn('[sms] failed to send SMS', err && err.message ? err.message : err);
    return { success: false, message: err && err.message };
  }
};

const sendOtpToPhone = async (phone, otp, purpose = 'verification') => {
  const body = `Your ${purpose} code is: ${otp}`;
  return sendSms(phone, body);
};

module.exports = { sendSms, sendOtpToPhone };
