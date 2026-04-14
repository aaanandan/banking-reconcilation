// Step 258: Invoice Generation
// Banking Reconciliation SaaS Platform

const stripeService = require('./stripe.service');
const logger = require('./logger');

/**
 * Format a Stripe invoice into a clean summary object for display / PDF generation.
 */
function formatInvoice(stripeInvoice) {
  return {
    id: stripeInvoice.id,
    number: stripeInvoice.number,
    status: stripeInvoice.status,
    amountDue: stripeInvoice.amount_due,
    amountPaid: stripeInvoice.amount_paid,
    currency: stripeInvoice.currency,
    periodStart: stripeInvoice.period_start
      ? new Date(stripeInvoice.period_start * 1000).toISOString()
      : null,
    periodEnd: stripeInvoice.period_end
      ? new Date(stripeInvoice.period_end * 1000).toISOString()
      : null,
    dueDate: stripeInvoice.due_date
      ? new Date(stripeInvoice.due_date * 1000).toISOString()
      : null,
    paidAt: stripeInvoice.status_transitions?.paid_at
      ? new Date(stripeInvoice.status_transitions.paid_at * 1000).toISOString()
      : null,
    hostedInvoiceUrl: stripeInvoice.hosted_invoice_url || null,
    invoicePdf: stripeInvoice.invoice_pdf || null,
    lineItems: (stripeInvoice.lines?.data || []).map((line) => ({
      description: line.description,
      amount: line.amount,
      currency: line.currency,
      quantity: line.quantity,
      period: {
        start: line.period?.start
          ? new Date(line.period.start * 1000).toISOString()
          : null,
        end: line.period?.end
          ? new Date(line.period.end * 1000).toISOString()
          : null,
      },
    })),
    subtotal: stripeInvoice.subtotal,
    tax: stripeInvoice.tax || 0,
    total: stripeInvoice.total,
    customerEmail: stripeInvoice.customer_email || null,
    customerName: stripeInvoice.customer_name || null,
  };
}

/**
 * Get paginated invoices for a customer and return formatted summaries.
 */
async function getInvoiceHistory(customerId, limit = 10) {
  try {
    const result = await stripeService.getInvoices(customerId, limit);
    const formatted = (result.data || []).map(formatInvoice);
    logger.info('Invoice history retrieved', { customerId, count: formatted.length });
    return { invoices: formatted, hasMore: result.has_more };
  } catch (err) {
    logger.error('Failed to retrieve invoice history', { customerId, error: err.message });
    throw err;
  }
}

/**
 * Get the upcoming invoice for a customer (preview of next billing cycle).
 */
async function getUpcomingInvoiceSummary(customerId) {
  try {
    const invoice = await stripeService.getUpcomingInvoice(customerId);
    const formatted = formatInvoice(invoice);
    logger.info('Upcoming invoice retrieved', { customerId, total: formatted.total });
    return formatted;
  } catch (err) {
    logger.error('Failed to retrieve upcoming invoice', { customerId, error: err.message });
    throw err;
  }
}

module.exports = { getInvoiceHistory, getUpcomingInvoiceSummary, formatInvoice };
