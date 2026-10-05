import { readFileSync } from "node:fs";
import { URL } from "node:url";
import { describe, it, expect } from "vitest";
import {
  parse,
  compileScript,
  compileTemplate,
} from "../../frontend/node_modules/@vue/compiler-sfc/dist/compiler-sfc.cjs.js";
import * as Vue from "../../frontend/node_modules/vue/dist/vue.runtime.esm-bundler.js";
import { renderToString } from "../../frontend/node_modules/@vue/server-renderer/dist/server-renderer.cjs.js";

// Execute the real SFC setup and template with only route/HTTP boundaries replaced.
const source = readFileSync(
  new URL(
    "../../frontend/src/modules/billing/presentation/BusinessBillingView.vue",
    import.meta.url,
  ),
  "utf8",
);
const { descriptor } = parse(source);
const script = compileScript(descriptor, { id: "billing-test" })
  .content.replace(/^import .*;?$/gm, "")
  .replace("export default", "return");
const template = compileTemplate({
  source: descriptor.template.content,
  filename: "BusinessBillingView.vue",
  id: "billing-test",
  compilerOptions: { mode: "function" },
});
if (template.errors.length) throw new Error(template.errors.join("\n"));
const render = new Function("Vue", template.code)(Vue);
async function screen(billing) {
  const mounted = [];
  const component = new Function(
    "onMounted",
    "ref",
    "computed",
    "useRoute",
    "BillingService",
    script,
  )(
    (fn) => mounted.push(fn),
    Vue.ref,
    Vue.computed,
    () => ({ params: { id: "business-one" } }),
    class {
      async getStatus() {
        return { billing };
      }
    },
  );
  const bindings = component.setup({}, { expose() {} });
  for (const fn of mounted) await fn();
  const ctx = Vue.reactive(bindings);
  const app = Vue.createSSRApp({ setup: () => () => render(ctx, []) });
  app.component("RouterLink", {
    props: ["to"],
    setup:
      (props, { slots }) =>
      () =>
        Vue.h("a", { href: props.to }, slots.default?.()),
  });
  return { html: await renderToString(app), bindings };
}

describe("billing frontend uses backend entitlement and displays the correct instant", () => {
  it("shows real trial status and trial end, even when current period is November", async () => {
    const { html, bindings } = await screen({
      status: "trialing",
      stripe_subscription_id: "sub_one",
      has_access: true,
      trial_end: "2026-10-04T20:30:00Z",
      current_period_end: "2026-11-03T20:30:00Z",
    });
    expect(html).toContain("trialing");
    expect(html).toContain("Fin de prueba:");
    expect(html).toContain(bindings.dateLabel("2026-10-04T20:30:00Z"));
    expect(html).not.toContain("3 de noviembre");
    expect(html).toContain("Entrar en mi negocio");
  });
  it("formats the complete instant in the browser timezone, including its hour", async () => {
    const { bindings } = await screen(null);
    const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    const expected = {
      UTC: "20:30",
      "Europe/Madrid": "22:30",
      "America/Los_Angeles": "13:30",
    };
    expect(expected[zone]).toBeDefined();
    expect(bindings.dateLabel("2026-10-04T20:30:00Z")).toContain(
      expected[zone],
    );
  });
  it("shows active and November renewal after transition", async () => {
    const { html, bindings } = await screen({
      status: "active",
      stripe_subscription_id: "sub_one",
      has_access: true,
      trial_end: "2026-10-04T20:30:00Z",
      current_period_end: "2026-11-03T20:30:00Z",
    });
    expect(html).toContain("active");
    expect(html).toContain("Próxima renovación:");
    expect(html).toContain(bindings.dateLabel("2026-11-03T20:30:00Z"));
    expect(html).not.toContain("Fin de prueba:");
  });
  it.each([
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
    "trialing",
    "active",
  ])(
    "never grants UI access to %s without backend entitlement",
    async (status) => {
      const { html } = await screen({
        status,
        stripe_subscription_id: "sub_one",
        has_access: false,
      });
      expect(html).not.toContain("Entrar en mi negocio");
      expect(html).toContain(status);
      expect(html).toContain("Gestionar pago y suscripción");
    },
  );
  it("shows exact trial end when renewal has been canceled", async () => {
    const { html, bindings } = await screen({
      status: "trialing",
      has_access: true,
      cancel_at_period_end: true,
      trial_end: "2026-10-04T20:30:00Z",
      current_period_end: "2026-11-03T20:30:00Z",
    });
    expect(html).toContain("Acceso hasta:");
    expect(html).toContain(bindings.dateLabel("2026-10-04T20:30:00Z"));
  });
  it("shows checkout rather than an entry link when no subscription exists", async () => {
    const { html } = await screen(null);
    expect(html).not.toContain("Entrar en mi negocio");
    expect(html).toContain("Pendiente de contratación");
  });
});

describe("actual dashboard business guard", () => {
  const router = readFileSync(
    new URL("../../frontend/src/router/index.js", import.meta.url),
    "utf8",
  );
  const fn = router.slice(
    router.indexOf("async function paidBusinessGuard"),
    router.indexOf("\nconst routes"),
  );
  const guard = (billing) =>
    new Function("billingService", `${fn}; return paidBusinessGuard;`)({
      getStatus: async () => ({ billing }),
    });
  it.each(["trialing", "active"])(
    "admits %s using server decision",
    async (status) => {
      expect(
        await guard({ status, has_access: true })({
          params: { id: "business-one" },
        }),
      ).toBe(true);
    },
  );
  it.each([
    "trialing",
    "active",
    "past_due",
    "canceled",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
  ])("redirects %s without entitlement", async (status) => {
    expect(
      await guard({ status, has_access: false })({
        params: { id: "business-one" },
      }),
    ).toEqual({ name: "business-billing", params: { id: "business-one" } });
  });
  it("redirects when status verification fails", async () => {
    const fnGuard = new Function(
      "billingService",
      `${fn}; return paidBusinessGuard;`,
    )({
      getStatus: async () => {
        throw new Error("unavailable");
      },
    });
    expect(await fnGuard({ params: { id: "business-one" } })).toEqual({
      name: "business-billing",
      params: { id: "business-one" },
    });
  });
});
