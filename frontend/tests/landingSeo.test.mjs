import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  faqs,
  landingSeo,
  structuredData,
} from "../src/modules/landing/seo/content.js";
const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../dist/index.html");
test("built landing has indexable product content and matching metadata", () => {
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1);
  assert.ok(html.includes(`<title>${landingSeo.title}</title>`));
  assert.ok(html.includes(`content="${landingSeo.description}"`));
  assert.ok(html.includes('rel="canonical" href="https://resbix.com/"'));
  assert.ok(
    html.includes(
      'name="robots" content="index, follow, max-image-preview:large"',
    ),
  );
  assert.ok(html.includes('id="demo"'));
  assert.ok(html.includes('id="precios"'));
  for (const faq of faqs) {
    assert.ok(html.includes(faq.q));
    assert.ok(html.includes(faq.a));
  }
  assert.equal(
    (html.match(/<link rel="stylesheet"/g) || []).length,
    2,
    "Prerender needs CSS before JavaScript",
  );
  const schema = JSON.parse(
    html.match(
      /<script id="landing-schema" type="application\/ld\+json">(.*?)<\/script>/s,
    )[1],
  );
  assert.deepEqual(schema, structuredData);
  assert.equal(
    schema["@graph"].find((item) => item["@type"] === "SoftwareApplication")
      .offers.price,
    "89.00",
  );
  assert.ok(!html.includes("aggregateRating"));
});
test("private SPA shell does not inherit landing canonical, schema or content", () => {
  const shell = read("../dist/app.html");
  assert.ok(!shell.includes("landing-schema"));
  assert.ok(!shell.includes('rel="canonical"'));
  assert.ok(!shell.includes("<h1"));
  assert.ok(!shell.includes('content="index, follow'));
  for (const route of [
    "login",
    "register",
    "dashboard",
    "businesses",
    "settings",
    "forgot-password",
    "reset-password",
  ]) {
    assert.ok(
      read(`../dist/${route}/index.html`).includes(
        'content="noindex, nofollow"',
      ),
    );
  }
  const config = JSON.parse(read("../vercel.json"));
  for (const source of [
    "/dashboard",
    "/businesses/:path*",
    "/settings",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/booking/:path*",
    "/chat/:path*",
  ]) {
    assert.ok(
      config.headers.some(
        (rule) =>
          rule.source === source &&
          rule.headers.some(
            (header) =>
              header.key === "X-Robots-Tag" && header.value.includes("noindex"),
          ),
      ),
    );
  }
  const urls = [
    ...read("../public/sitemap.xml").matchAll(/<loc>(.*?)<\/loc>/g),
  ].map((match) => match[1]);
  assert.ok(urls.includes(landingSeo.url));
  assert.ok(
    urls.every(
      (url) =>
        !/dashboard|businesses|settings|login|register|booking\//.test(url),
    ),
  );
});
test("demo is isolated from SaaS dependencies", () => {
  const demo = read(
    "../src/modules/landing/presentation/components/BookingDemo.vue",
  );
  assert.equal((demo.match(/^import .* from /gm) || []).length, 1);
  assert.ok(demo.includes('from "vue"'));
  assert.ok(
    !/\bfetch\s*\(|localStorage|sessionStorage|supabase|groq|stripe|apiFetch/i.test(
      demo,
    ),
  );
  assert.ok(demo.includes("onBeforeUnmount(() => clearTimeout(timer))"));
});
