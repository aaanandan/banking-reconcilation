// Step 259: Email Notifications for Billing Events
// Banking Reconciliation SaaS Platform
// Uses nodemailer (or logs to stdout in test/dev when SMTP not configured)

const logger = require('./logger');

// ─────────────────────────────────────────────────────────────────────────────
// Transport setup — uses SMTP env vars; falls back to console in dev/test
// ─────────────────────────────────────────────────────────────────────────────
function getTransport() {
  if (process.env.SMTP_HOST) {
    // Production: requires nodemailer installed and SMTP_* env vars set
    // const nodemailer = require('nodemailer');
    // return nodemailer.createTransport({ ... });
    throw new Error('SMTP transport not configured — install nodemailer and set SMTP_* env vars');
  }
  // Dev/test stub: log emails to stdout
  return {
    sendMail: async (opts) => {
      logger.info('EMAIL (stub)', {
        to: opts.to,
        subject: opts.subject,
        body: opts.text || opts.html,
      });
      return { messageId: `stub-${Date.now()}` };
    },
  };
}

const FROM_ADDRESS = process.env.EMAIL_FROM || 'billing@banking-recon.com';

async function sendEmail(to, subject, text, html) {
  const transport = getTransport();
  try {
    const result = await transport.sendMail({ from: FROM_ADDRESS, to, subject, text, html });
    logger.info('Billing email sent', { to, subject, messageId: result.messageId });
    return result;
  } catch (err) {
    logger.error('Billing email failed', { to, subject, error: err.message });
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Step 259: Billing email notifications
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sent when a new subscription is created.
 */
async function sendSubscriptionConfirmation(email, { tenantName, planName, price, nextBillingDate }) {
  const subject = `Subscription Confirmed — ${planName} Plan`;
  const text = [
    `Hi ${tenantName},`,
    '',
    `Your subscription to the ${planName} plan ($${price}/month) is now active.`,
    `Your next billing date is ${nextBillingDate}.`,
    '',
    'You can manage your subscription at any time in the Billing section of your dashboard.',
    '',
    'Thank you for choosing Banking Reconciliation!',
  ].join('\n');

  return sendEmail(email, subject, text);
}

/**
 * Sent when a plan is upgraded or downgraded.
 */
async function sendPlanChangeNotification(email, { tenantName, oldPlan, newPlan, effectiveDate, proration }) {
  const direction = proration > 0 ? 'upgrade' : 'downgrade';
  const subject = `Plan ${direction === 'upgrade' ? 'Upgraded' : 'Downgraded'} — ${newPlan}`;
  const text = [
    `Hi ${tenantName},`,
    '',
    `Your plan has been changed from ${oldPlan} to ${newPlan}.`,
    `Effective date: ${effectiveDate}.`,
    proration
      ? `A prorated adjustment of $${(Math.abs(proration) / 100).toFixed(2)} has been applied to your account.`
      : '',
    '',
    'Your new features and limits are now active.',
  ].join('\n');

  return sendEmail(email, subject, text);
}

/**
 * Sent when a subscription is cancelled.
 */
async function sendCancellationNotification(email, { tenantName, planName, endDate }) {
  const subject = `Subscription Cancelled — ${planName}`;
  const text = [
    `Hi ${tenantName},`,
    '',
    `Your ${planName} subscription has been cancelled.`,
    `You will retain access to paid features until ${endDate}.`,
    'After that date your account will revert to the Free plan.',
    '',
    'We are sorry to see you go. If you have feedback, please reply to this email.',
  ].join('\n');

  return sendEmail(email, subject, text);
}

/**
 * Sent when a payment succeeds.
 */
async function sendPaymentSuccessNotification(email, { tenantName, amount, currency, invoiceUrl, period }) {
  const subject = `Payment Received — $${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  const text = [
    `Hi ${tenantName},`,
    '',
    `We have received your payment of $${(amount / 100).toFixed(2)} ${currency.toUpperCase()} for the period ${period}.`,
    invoiceUrl ? `View your invoice: ${invoiceUrl}` : '',
    '',
    'Thank you!',
  ].join('\n');

  return sendEmail(email, subject, text);
}

/**
 * Sent when a payment fails.
 */
async function sendPaymentFailureNotification(email, { tenantName, amount, currency, attemptCount, nextRetryDate }) {
  const subject = `Payment Failed — Action Required`;
  const text = [
    `Hi ${tenantName},`,
    '',
    `We were unable to process your payment of $${(amount / 100).toFixed(2)} ${currency.toUpperCase()}.`,
    `This is attempt ${attemptCount}.`,
    nextRetryDate ? `We will retry on ${nextRetryDate}.` : 'Please update your payment method to avoid service interruption.',
    '',
    'Update your payment method in the Billing section of your dashboard.',
  ].join('\n');

  return sendEmail(email, subject, text);
}

/**
 * Sent when a quota is exceeded.
 */
async function sendQuotaExceededNotification(email, { tenantName, resource, used, limit, planName }) {
  const subject = `Quota Exceeded — ${resource}`;
  const text = [
    `Hi ${tenantName},`,
    '',
    `You have exceeded your ${resource} quota on the ${planName} plan.`,
    `Used: ${used.toLocaleString()} / Limit: ${limit.toLocaleString()}`,
    '',
    'To continue using this feature without interruption, please upgrade your plan.',
    'Visit the Billing section in your dashboard to upgrade.',
  ].join('\n');

  return sendEmail(email, subject, text);
}

/**
 * Sent when a refund is issued.
 */
async function sendRefundNotification(email, { tenantName, amount, currency, reason }) {
  const subject = `Refund Issued — $${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  const text = [
    `Hi ${tenantName},`,
    '',
    `A refund of $${(amount / 100).toFixed(2)} ${currency.toUpperCase()} has been issued to your payment method.`,
    reason ? `Reason: ${reason}` : '',
    'Refunds typically appear within 5-10 business days.',
    '',
    'Please contact support if you have any questions.',
  ].join('\n');

  return sendEmail(email, subject, text);
}

module.exports = {
  sendSubscriptionConfirmation,
  sendPlanChangeNotification,
  sendCancellationNotification,
  sendPaymentSuccessNotification,
  sendPaymentFailureNotification,
  sendQuotaExceededNotification,
  sendRefundNotification,
};
