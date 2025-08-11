const express = require('express');

// Lazy init Stripe to allow process start without keys in some envs
let stripe = null;
function getStripe() {
  if (!stripe) {
    const Stripe = require('stripe');
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  }
  return stripe;
}

/**
 * Creates payment routes and webhook handler.
 * We keep webhook as a separate handler so it can be mounted with express.raw.
 */
module.exports = (prisma) => {
  const router = express.Router();

  // Create Checkout Session (one-time or subscription)
  router.post('/create-checkout-session', async (req, res) => {
    try {
      const {
        priceId,
        quantity = 1,
        mode = 'subscription', // 'subscription' | 'payment'
        customerEmail,
        userId,
        successUrl,
        cancelUrl,
      } = req.body || {};

      if (!priceId) {
        return res.status(400).json({ error: 'priceId is required' });
      }

      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const session = await getStripe().checkout.sessions.create({
        mode,
        line_items: [
          {
            price: priceId,
            quantity,
          },
        ],
        success_url: successUrl || `${frontendBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${frontendBaseUrl}/billing/cancel`,
        customer_email: customerEmail,
        allow_promotion_codes: true,
        metadata: {
          userId: userId ? String(userId) : undefined,
        },
      });

      return res.json({ id: session.id, url: session.url });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
    }
  });

  // Create Billing Portal Session
  router.post('/create-portal-session', async (req, res) => {
    try {
      const { customerId, checkoutSessionId, returnUrl } = req.body || {};

      let resolvedCustomerId = customerId;
      if (!resolvedCustomerId) {
        if (!checkoutSessionId) {
          return res.status(400).json({ error: 'customerId or checkoutSessionId is required' });
        }
        const session = await getStripe().checkout.sessions.retrieve(checkoutSessionId);
        resolvedCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      }

      if (!resolvedCustomerId) {
        return res.status(400).json({ error: 'Unable to resolve Stripe customer ID' });
      }

      const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const portalSession = await getStripe().billingPortal.sessions.create({
        customer: resolvedCustomerId,
        return_url: returnUrl || `${frontendBaseUrl}/billing/portal/return`,
      });

      return res.json({ url: portalSession.url });
    } catch (error) {
      console.error('Error creating portal session:', error);
      return res.status(500).json({ error: error.message || 'Failed to create portal session' });
    }
  });

  // Webhook handler kept separate to allow raw body verification
  const webhookHandler = async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      let event = req.body; // may be Buffer if raw, but we will construct if secret is set

      if (webhookSecret) {
        const rawBody = req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body));
        event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
      }

      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          console.log('Checkout completed:', session.id);
          // Persist subscription/payment state here with prisma when schema is ready
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          console.log('Subscription event:', event.type, subscription.id);
          // Update subscription state in DB
          break;
        }
        default:
          console.log('Unhandled Stripe event type:', event.type);
      }

      return res.status(200).json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
  };

  return { router, webhookHandler };
};