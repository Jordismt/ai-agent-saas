// Dates schedule reconciliation; only Stripe's status grants an entitlement.
export function hasSubscriptionAccess(billing) {
  return Boolean(
    billing?.stripe_subscription_id &&
    ["active", "trialing"].includes(billing.status),
  );
}

export function needsSubscriptionRefresh(billing, now = Date.now()) {
  if (!billing?.stripe_subscription_id) return false;
  if (!hasSubscriptionAccess(billing)) return true;
  const end =
    billing.status === "trialing"
      ? billing.trial_end
      : billing.current_period_end;
  const instant = Date.parse(end);
  return !Number.isFinite(instant) || instant <= now;
}

export const stripeInstant = (seconds) =>
  seconds == null ? null : new Date(seconds * 1000).toISOString();

export function subscriptionFields(subscription) {
  return {
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    trial_end: stripeInstant(subscription.trial_end),
    // Basil and later put the period on the item; older webhook/API versions used the root.
    current_period_end: stripeInstant(
      subscription.items?.data?.[0]?.current_period_end ??
        subscription.current_period_end,
    ),
  };
}
