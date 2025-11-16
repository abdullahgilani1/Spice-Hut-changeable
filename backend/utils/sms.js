/**
 * Lightweight Twilio SMS helper. Non-blocking: if Twilio env vars are missing
 * this module will log a warning and resolve without throwing so it doesn't
 * break existing flows.
 */
// Accept multiple common env var names for compatibility with different setups
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH;
const twilioFrom =
  process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM;

// Debug: report presence of Twilio env values (do not log secrets)
try {
  const hasSid = !!twilioAccountSid;
  const hasAuth = !!twilioAuthToken;
  const hasFrom = !!twilioFrom;
  console.debug(`[sms-debug] env detection - SID:${hasSid} AUTH:${hasAuth} FROM:${hasFrom}`);
} catch (e) {
  // ignore
}

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
