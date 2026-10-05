import { describe, it, expect } from "vitest";
import {
  hasSubscriptionAccess,
  needsSubscriptionRefresh,
  stripeInstant,
  subscriptionFields,
} from "../src/shared/billing/subscriptionPolicy.js";

const billing = (status, fields = {}) => ({
  status,
  stripe_subscription_id: "sub_test",
  ...fields,
});

describe("subscription policy: Stripe status grants access; dates trigger verification", () => {
  it.each(["trialing", "active"])(
    "allows only a bound %s subscription",
    (status) => {
      expect(hasSubscriptionAccess(billing(status))).toBe(true);
      expect(hasSubscriptionAccess({ status })).toBe(false);
    },
  );
  it.each([
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
    "checkout_pending",
    "unknown",
    null,
  ])("denies %s", (status) => {
    expect(hasSubscriptionAccess(billing(status))).toBe(false);
    expect(needsSubscriptionRefresh(billing(status))).toBe(true);
  });
  it.each([null, undefined, {}, { status: "active" }, { status: "trialing" }])(
    "denies missing subscription %j",
    (row) => {
      expect(hasSubscriptionAccess(row)).toBe(false);
      expect(needsSubscriptionRefresh(row)).toBe(false);
    },
  );
  it.each([
    "2026-10-03T12:59:56Z", // observed database row
    "2026-11-01T00:00:00Z", // UTC month boundary
    "2027-01-01T00:00:00Z", // UTC year boundary
    "2026-10-04T20:30:00Z", // the actual scenario: not midnight
    "2026-10-05T00:30:00+02:00", // crosses local midnight
    "2026-11-01T00:00:00+01:00", // month boundary
    "2027-01-01T00:00:00+01:00", // year boundary
    "2026-10-25T02:30:00+02:00", // DST first 02:30
    "2026-10-25T02:30:00+01:00", // DST second 02:30
    "2026-10-04T17:30:00-07:00", // different browser/server zone
  ])(
    "verifies exactly at the instant %s, never the beginning of its day",
    (trial_end) => {
      const row = billing("trialing", { trial_end });
      const end = Date.parse(trial_end);
      expect(needsSubscriptionRefresh(row, end - 1)).toBe(false);
      expect(needsSubscriptionRefresh(row, end)).toBe(true);
      expect(needsSubscriptionRefresh(row, end + 1)).toBe(true);
      expect(hasSubscriptionAccess(row)).toBe(true); // Stripe must decide the transition.
    },
  );
  it.each([null, undefined, "bad-date"])(
    "verifies missing/invalid trial or active period %s",
    (end) => {
      expect(
        needsSubscriptionRefresh(billing("trialing", { trial_end: end })),
      ).toBe(true);
      expect(
        needsSubscriptionRefresh(
          billing("active", { current_period_end: end }),
        ),
      ).toBe(true);
    },
  );
  it("keeps an active period usable until exact renewal, then verifies", () => {
    const end = "2026-11-03T20:30:00Z";
    const row = billing("active", {
      current_period_end: end,
      trial_end: "2026-10-04T20:30:00Z",
    });
    expect(needsSubscriptionRefresh(row, Date.parse(end) - 1)).toBe(false);
    expect(needsSubscriptionRefresh(row, Date.parse(end))).toBe(true);
    expect(needsSubscriptionRefresh(row, Date.parse(end) + 1)).toBe(true);
  });
  it("converts Unix seconds to a complete UTC instant, including zero", () => {
    expect(stripeInstant(0)).toBe("1970-01-01T00:00:00.000Z");
    expect(stripeInstant(Date.parse("2026-10-04T20:30:00Z") / 1000)).toBe(
      "2026-10-04T20:30:00.000Z",
    );
    expect(stripeInstant(null)).toBeNull();
  });
  it("uses item period for current API and root period for older API without stale fallback", () => {
    expect(
      subscriptionFields({
        id: "sub_test",
        status: "active",
        current_period_end: 10,
        items: { data: [{ current_period_end: 20 }] },
      }).current_period_end,
    ).toBe(stripeInstant(20));
    expect(
      subscriptionFields({
        id: "sub_test",
        status: "trialing",
        current_period_end: 10,
      }).current_period_end,
    ).toBe(stripeInstant(10));
    expect(
      subscriptionFields({ id: "sub_test", status: "active" })
        .current_period_end,
    ).toBeNull();
  });
});
