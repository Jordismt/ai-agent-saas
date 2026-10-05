import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { Buffer } from "node:buffer";
import { billingDatabase } from "./helpers/BillingDatabase.js";
const mocks = vi.hoisted(() => ({
  database: null,
  retrieve: vi.fn(),
  checkout: vi.fn(),
  session: null,
}));
vi.mock("../src/infrastructure/database/supabase.js", () => ({
  createSupabaseServerClient: () => mocks.database,
  createSupabaseClient: () => ({
    auth: { getUser: async () => mocks.session },
  }),
}));
vi.mock("stripe", async (importOriginal) => {
  const { default: Stripe } = await importOriginal();
  const real = new Stripe("sk_test_fixture");
  return {
    default: class {
      constructor() {
        this.webhooks = real.webhooks;
        this.subscriptions = { retrieve: mocks.retrieve };
        this.checkout = { sessions: { create: mocks.checkout } };
      }
    },
  };
});
vi.mock("../src/shared/middleware/rateLimits.js", () => ({
  billingLimiter: (_req, _res, next) => next(),
  bookingLimiter: (_req, _res, next) => next(),
}));
import billingRoutes, {
  stripeWebhook,
} from "../src/modules/billing/presentation/billingRoutes.js";
import publicRoutes from "../src/modules/publicPages/presentation/businessPublicPageRoutes.js";
import { requireActiveBusiness } from "../src/shared/billing/requireActiveBusiness.js";
import {
  reconcileBusinessBilling,
  stripe,
} from "../src/shared/billing/subscriptionSync.js";
import { stripeInstant } from "../src/shared/billing/subscriptionPolicy.js";
import { authMiddleware } from "../src/shared/middleware/authMiddleware.js";
const businessId = "11111111-1111-4111-8111-111111111111",
  otherId = "22222222-2222-4222-8222-222222222222",
  owner = "owner-one";
const end = Date.parse("2026-10-04T20:30:00Z"),
  period = Date.parse("2026-11-03T20:30:00Z");
const sub = (status = "trialing", fields = {}) => ({
  id: "sub_one",
  status,
  customer: "cus_one",
  metadata: { business_id: businessId, owner_id: owner },
  trial_end: end / 1000,
  items: {
    data: [
      {
        current_period_start: end / 1000,
        current_period_end: (status === "trialing" ? end : period) / 1000,
      },
    ],
  },
  discounts: [],
  cancel_at_period_end: false,
  cancel_at: null,
  ...fields,
});
const local = (status = "trialing", fields = {}) => ({
  business_id: businessId,
  stripe_subscription_id: "sub_one",
  status,
  trial_end: stripeInstant(end / 1000),
  current_period_end: stripeInstant(end / 1000),
  updated_at: "2026-09-27T20:30:00.000Z",
  ...fields,
});
async function invoke(handler, req = {}) {
  let failure;
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
  };
  await handler({ headers: {}, ...req }, res, (error) => {
    failure = error;
  });
  if (failure) throw failure;
  return res;
}
async function endpoint(router, path, req = {}, method = "get") {
  const route = router.stack.find(
    (layer) => layer.route?.path === path && layer.route.methods[method],
  ).route;
  if (route.stack.some((layer) => layer.handle === authMiddleware)) {
    const auth = await invoke(authMiddleware, {
      originalUrl: path,
      headers: { authorization: "Bearer fixture" },
      ...req,
    });
    if (auth.statusCode !== 200) return auth;
    req.user = mocks.session.data.user;
  }
  return invoke(route.stack.at(-1).handle, req);
}
const status = (id = businessId) =>
  endpoint(billingRoutes, "/status", { query: { businessId: id } });
const page = (slug = "business-one", body = {}) =>
  endpoint(publicRoutes, "/public/pages/:slug", { params: { slug }, body });
async function webhook(type, object, options = {}) {
  const body = JSON.stringify({
    id: "evt_one",
    object: "event",
    type,
    created: end / 1000,
    data: { object },
    ...options,
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload: body,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  return invoke(stripeWebhook, {
    body: Buffer.from(body),
    headers: { "stripe-signature": signature },
  });
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(end - 1000);
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture");
  vi.stubEnv("FRONTEND_URL", "https://fixture.example");
  vi.stubEnv("STRIPE_PRICE_ID", "price_fixture");
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.retrieve.mockReset().mockResolvedValue(sub());
  mocks.checkout.mockReset().mockResolvedValue({
    id: "cs_one",
    url: "https://checkout.stripe.com/fixture",
  });
  mocks.session = {
    data: { user: { id: owner, email: "fixture@example.test" } },
    error: null,
  };
  mocks.database = billingDatabase({
    businesses: [
      { id: businessId, owner_id: owner, name: "Business one" },
      { id: otherId, owner_id: "owner-two", name: "Business two" },
    ],
    business_billing: [
      local(),
      local("active", {
        business_id: otherId,
        stripe_subscription_id: "sub_two",
      }),
    ],
    billing_customers: [{ user_id: owner, stripe_customer_id: "cus_one" }],
    account_deletion_requests: [],
    business_public_pages: [
      {
        business_id: businessId,
        slug: "business-one",
        published: true,
        show_services: true,
      },
    ],
    business_services: [],
    employees: [],
    business_hours: [],
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("checkout -> signed webhook -> repository -> billing/dashboard entitlement/public page", () => {
  it("tests the complete trial transition including exact end and November renewal", async () => {
    mocks.database.tables.business_billing = [];
    expect(
      (
        await endpoint(
          billingRoutes,
          "/checkout",
          { body: { businessId } },
          "post",
        )
      ).body.url,
    ).toContain("checkout.stripe.com");
    expect(mocks.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        customer: "cus_one",
        subscription_data: expect.objectContaining({
          trial_period_days: 7,
          metadata: { business_id: businessId, owner_id: owner },
        }),
      }),
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    await expect(page()).rejects.toMatchObject({ statusCode: 403 });
    await webhook("checkout.session.completed", {
      id: "cs_one",
      mode: "subscription",
      subscription: "sub_one",
      metadata: { business_id: businessId },
    });
    expect((await status()).body.billing).toMatchObject({
      status: "trialing",
      has_access: true,
      trial_end: stripeInstant(end / 1000),
    });
    expect((await page()).body.business.id).toBe(businessId);
    vi.setSystemTime(end - 1);
    mocks.retrieve.mockClear();
    await requireActiveBusiness(businessId, mocks.database);
    expect(mocks.retrieve).not.toHaveBeenCalled();
    vi.setSystemTime(end);
    expect((await page()).body.business.id).toBe(businessId);
    expect(mocks.retrieve).toHaveBeenCalled();
    mocks.retrieve.mockResolvedValue(sub("active"));
    await webhook("customer.subscription.updated", sub("active"));
    expect((await status()).body.billing).toMatchObject({
      status: "active",
      has_access: true,
      trial_end: stripeInstant(end / 1000),
      current_period_end: stripeInstant(period / 1000),
    });
    vi.setSystemTime(end + 1);
    expect((await page()).body.business.id).toBe(businessId);
    expect(
      (await requireActiveBusiness(businessId, mocks.database)).status,
    ).toBe("active");
  });
  it.each([
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
  ])(
    "missed webhook: reconciles actual %s and applies same entitlement",
    async (finalStatus) => {
      vi.setSystemTime(end + 1);
      mocks.retrieve.mockResolvedValue(sub(finalStatus));
      const accessible = ["trialing", "active"].includes(finalStatus);
      if (accessible) expect((await page()).body.business.id).toBe(businessId);
      else await expect(page()).rejects.toMatchObject({ statusCode: 403 });
      expect(mocks.database.tables.business_billing[0].status).toBe(
        finalStatus,
      );
      expect((await status()).body.billing).toMatchObject({
        status: finalStatus,
        has_access: accessible,
      });
    },
  );
  it.each([false, true])(
    "Checkout pending cannot overwrite a racing webhook: prior row=%s",
    async (prior) => {
      mocks.database.tables.business_billing = prior
        ? [
            {
              business_id: businessId,
              status: "checkout_pending",
              updated_at: "2026-09-27T20:30:00.000Z",
            },
          ]
        : [];
      mocks.retrieve.mockResolvedValue(sub("active"));
      mocks.checkout.mockImplementationOnce(async () => {
        await webhook("customer.subscription.created", sub("active"));
        return { id: "cs_one", url: "https://checkout.stripe.com/fixture" };
      });
      const result = await endpoint(
        billingRoutes,
        "/checkout",
        { body: { businessId } },
        "post",
      );
      expect(result.statusCode).toBe(409);
      expect(mocks.database.tables.business_billing[0]).toMatchObject({
        status: "active",
        stripe_subscription_id: "sub_one",
      });
    },
  );
  it.each([null, "bad-date", undefined])(
    "verifies Stripe rather than admitting a trial with missing/invalid end %s",
    async (trial_end) => {
      mocks.database.tables.business_billing[0].trial_end = trial_end;
      mocks.retrieve.mockResolvedValue(sub("past_due"));
      await expect(page()).rejects.toMatchObject({ statusCode: 403 });
      expect(mocks.retrieve).toHaveBeenCalled();
      expect((await status()).body.billing.has_access).toBe(false);
    },
  );
  it("refreshes an active subscription whose period is missing", async () => {
    Object.assign(mocks.database.tables.business_billing[0], {
      status: "active",
      current_period_end: null,
    });
    mocks.retrieve.mockResolvedValue(sub("active"));
    expect((await page()).statusCode).toBe(200);
    expect(mocks.database.tables.business_billing[0].current_period_end).toBe(
      stripeInstant(period / 1000),
    );
  });
  it("repairs the October stale trial/November current period together", async () => {
    vi.setSystemTime("2026-10-05T10:00:00Z");
    mocks.retrieve.mockResolvedValue(sub("active"));
    expect((await status()).body.billing).toMatchObject({
      status: "active",
      current_period_end: "2026-11-03T20:30:00.000Z",
      trial_end: "2026-10-04T20:30:00.000Z",
    });
    expect((await page()).statusCode).toBe(200);
  });
  it.each([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ])("handles duplicate/old %s using current Stripe state", async (type) => {
    const current =
      type === "customer.subscription.deleted" ? "canceled" : "active";
    const incoming =
      type === "customer.subscription.deleted" ? "canceled" : "trialing";
    mocks.retrieve.mockResolvedValue(sub(current));
    await webhook(type, sub(incoming), {
      id: "evt_old",
      created: end / 1000 - 600,
    });
    await webhook(type, sub(incoming), {
      id: "evt_old",
      created: end / 1000 - 600,
    });
    expect(mocks.database.tables.business_billing[0].status).toBe(current);
  });
  it("processes cancellation and delayed trial/checkout cannot resurrect it", async () => {
    mocks.retrieve.mockResolvedValue(sub("canceled"));
    await webhook("customer.subscription.deleted", sub("canceled"));
    await webhook("customer.subscription.created", sub());
    await webhook("checkout.session.completed", {
      id: "cs_one",
      mode: "subscription",
      subscription: "sub_one",
      metadata: { business_id: businessId },
    });
    expect((await status()).body.billing).toMatchObject({
      status: "canceled",
      has_access: false,
    });
    await expect(page()).rejects.toMatchObject({ statusCode: 403 });
  });
  it.each([
    { subscription: "sub_one" },
    { subscription: { id: "sub_one" } },
    { parent: { subscription_details: { subscription: "sub_one" } } },
    { parent: { subscription_details: { subscription: { id: "sub_one" } } } },
  ])(
    "handles invoice failure %j and old/duplicate timestamps",
    async (invoice) => {
      mocks.retrieve.mockResolvedValue(sub("past_due"));
      await webhook("invoice.payment_failed", invoice);
      await webhook("invoice.payment_failed", invoice);
      await webhook("invoice.payment_failed", invoice, {
        id: "evt_older",
        created: end / 1000 - 500,
      });
      expect(mocks.database.tables.business_billing[0]).toMatchObject({
        status: "past_due",
        last_payment_failed_at: stripeInstant(end / 1000),
      });
      expect((await status()).body.billing.has_access).toBe(false);
      await expect(page()).rejects.toMatchObject({ statusCode: 403 });
      expect(mocks.database.tables.business_billing[1].status).toBe("active");
    },
  );
  it("recovers a failed payment from real Stripe status", async () => {
    mocks.database.tables.business_billing[0].status = "past_due";
    mocks.retrieve.mockResolvedValue(sub("active"));
    expect((await page()).statusCode).toBe(200);
    expect((await status()).body.billing.status).toBe("active");
  });
  it.each([
    "invoice.paid",
    "invoice.payment_succeeded",
    "invoice.created",
    "unrelated.event",
  ])("ignores unused %s without inventing active", async (type) => {
    expect(
      (await webhook(type, { subscription: "sub_one" })).body.received,
    ).toBe(true);
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });
  it("scheduled cancellation retains access until Stripe cancels at the end", async () => {
    mocks.retrieve.mockResolvedValue(
      sub("active", { cancel_at_period_end: true, cancel_at: period / 1000 }),
    );
    expect((await status()).body.billing).toMatchObject({
      status: "active",
      has_access: true,
      cancel_at_period_end: true,
      cancel_at: stripeInstant(period / 1000),
    });
    vi.setSystemTime(period - 1);
    expect((await page()).statusCode).toBe(200);
    vi.setSystemTime(period);
    mocks.retrieve.mockResolvedValue(sub("canceled"));
    await expect(page()).rejects.toMatchObject({ statusCode: 403 });
  });
});
describe("security, retry and concurrency boundaries", () => {
  it("denies no subscription without querying Stripe", async () => {
    mocks.database.tables.business_billing = [];
    expect((await status()).body.billing).toBeNull();
    await expect(page()).rejects.toMatchObject({ statusCode: 403 });
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });
  it("returns 404 for nonexistent/unpublished public page", async () => {
    await expect(page("missing")).rejects.toMatchObject({ statusCode: 404 });
    mocks.database.tables.business_public_pages[0].published = false;
    await expect(page()).rejects.toMatchObject({ statusCode: 404 });
  });
  it("does not synchronize a nonexistent business", async () => {
    vi.setSystemTime(end);
    mocks.database.tables.businesses = [];
    await expect(page()).rejects.toMatchObject({ statusCode: 403 });
    expect((await status()).statusCode).toBe(404);
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });
  it("uses published slug tenant, never client body tenant", async () => {
    expect(
      (await page("business-one", { businessId: otherId })).body.business.id,
    ).toBe(businessId);
    expect(
      mocks.database.calls.filter(
        (c) => c.table === "business_billing" && c.operation !== "read",
      ),
    ).toEqual([]);
  });
  it("prevents billing/checkout cross-owner access", async () => {
    expect((await status(otherId)).statusCode).toBe(404);
    expect(
      (
        await endpoint(
          billingRoutes,
          "/checkout",
          { body: { businessId: otherId } },
          "post",
        )
      ).statusCode,
    ).toBe(404);
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.checkout).not.toHaveBeenCalled();
  });
  it("requires authentication and valid session", async () => {
    expect(
      (
        await endpoint(billingRoutes, "/status", {
          headers: {},
          query: { businessId },
        })
      ).statusCode,
    ).toBe(401);
    mocks.session = { data: { user: null }, error: { message: "invalid" } };
    expect((await status()).statusCode).toBe(401);
    expect(mocks.retrieve).not.toHaveBeenCalled();
  });
  it.each([
    { metadata: { business_id: otherId, owner_id: owner } },
    { metadata: { business_id: businessId, owner_id: "owner-two" } },
    { customer: "cus_other" },
    { id: "sub_other" },
  ])("rejects mismatched subscription %j", async (fields) => {
    vi.setSystemTime(end);
    mocks.retrieve.mockResolvedValue(sub("active", fields));
    await expect(status()).rejects.toMatchObject({ statusCode: 409 });
    await expect(page()).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      webhook("customer.subscription.updated", sub()),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(mocks.database.tables.business_billing[0].status).toBe("trialing");
  });
  it("ignores different subscription ID for a bound business", async () => {
    await webhook(
      "customer.subscription.updated",
      sub("active", { id: "sub_old" }),
    );
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(
      mocks.database.tables.business_billing[0].stripe_subscription_id,
    ).toBe("sub_one");
  });
  it("skips deleted businesses and owners deleting accounts", async () => {
    mocks.database.tables.businesses = [];
    await webhook("customer.subscription.updated", sub("active"));
    expect(mocks.retrieve).not.toHaveBeenCalled();
    mocks.database.tables.businesses = [{ id: businessId, owner_id: owner }];
    mocks.database.tables.account_deletion_requests = [
      { user_id: owner, status: "pending" },
    ];
    await webhook("customer.subscription.updated", sub("active"));
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect((await status()).statusCode).toBe(423);
  });
  it("verifies actual Stripe signatures and rejects missing/tampered body", async () => {
    const body = JSON.stringify({
      type: "customer.subscription.updated",
      data: { object: sub("active") },
    });
    const signature = stripe.webhooks.generateTestHeaderString({
      payload: body,
      secret: "whsec_fixture",
    });
    for (const req of [
      { body: Buffer.from(body), headers: {} },
      { body: Buffer.from(body), headers: { "stripe-signature": "invalid" } },
      {
        body: Buffer.from(body + " "),
        headers: { "stripe-signature": signature },
      },
    ])
      expect((await invoke(stripeWebhook, req)).statusCode).toBe(400);
    expect(mocks.database.calls).toEqual([]);
  });
  it("requires webhook secret", async () => {
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
    expect((await invoke(stripeWebhook)).statusCode).toBe(500);
    expect(mocks.database.calls).toEqual([]);
  });
  it("fails closed on Stripe missing resource/network failure", async () => {
    vi.setSystemTime(end);
    mocks.retrieve.mockRejectedValue(
      Object.assign(new Error("Stripe unavailable"), {
        code: "resource_missing",
      }),
    );
    await expect(page()).rejects.toMatchObject({ code: "resource_missing" });
    await expect(status()).rejects.toMatchObject({ code: "resource_missing" });
    await expect(
      webhook("customer.subscription.updated", sub()),
    ).rejects.toMatchObject({ code: "resource_missing" });
    expect(mocks.database.tables.business_billing[0].status).toBe("trialing");
  });
  it.each(["read", "update"])(
    "propagates database %s failures and succeeds on delivery retry",
    async (operation) => {
      mocks.database.failures.push({
        table: "business_billing",
        operation,
        error: { code: "db_failure" },
      });
      mocks.retrieve.mockResolvedValue(sub("active"));
      await expect(
        webhook("customer.subscription.updated", sub("active")),
      ).rejects.toMatchObject({ code: "db_failure" });
      expect(mocks.database.tables.business_billing[0].status).toBe("trialing");
      await webhook("customer.subscription.updated", sub("active"));
      expect(mocks.database.tables.business_billing[0].status).toBe("active");
    },
  );
  it.each([false, true])(
    "rejects an obsolete concurrent response, including initial insert=%s",
    async (initial) => {
      if (initial) mocks.database.tables.business_billing = [];
      let resolveOld, notifyStarted;
      const started = new Promise((resolve) => {
        notifyStarted = resolve;
      });
      mocks.retrieve.mockImplementationOnce(() => {
        notifyStarted();
        return new Promise((resolve) => {
          resolveOld = resolve;
        });
      });
      const slow = reconcileBusinessBilling(mocks.database, businessId, {
        subscriptionId: "sub_one",
      });
      const rejected = expect(slow).rejects.toMatchObject({ statusCode: 503 });
      await started;
      mocks.retrieve.mockResolvedValue(sub("active"));
      await webhook("customer.subscription.updated", sub("active"));
      resolveOld(sub("trialing"));
      await rejected;
      expect(mocks.database.tables.business_billing[0].status).toBe("active");
      await webhook("customer.subscription.created", sub());
      expect(mocks.database.tables.business_billing[0].status).toBe("active");
    },
  );
});
