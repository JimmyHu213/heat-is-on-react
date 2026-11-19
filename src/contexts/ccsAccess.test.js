import test from "node:test";
import assert from "node:assert/strict";
import { accessDeadline, takeHandoff } from "./ccsAccess.js";

test("CCS access ends at the earlier of subscription expiry and the original 24-hour deadline", () => {
  const claims = { firebase: { sign_in_provider: "custom" }, auth_time: 1000, sub_expires: 2000 };
  assert.equal(accessDeadline("legacy-uid", claims), 2000000);
  assert.equal(accessDeadline("ccs-1", { ...claims, sub_expires: 999999 }), 87400000);
  assert.equal(accessDeadline("ccs-1", { ...claims, sub_expires: "2000" }), 0);
  assert.equal(accessDeadline("ccs-reporter", claims), 0);
  const password = { firebase: { sign_in_provider: "password" } };
  assert.equal(accessDeadline("legacy-uid", password), Infinity);
  assert.equal(accessDeadline("legacy-uid", password, true), 0);
});

test("the auth landing removes its fragment and query before handing off the token", () => {
  const history = { state: {}, replaceState(state, title, url) { this.url = url; } };
  assert.equal(takeHandoff({ pathname: "/auth", hash: "#token=example" }, history), "example");
  assert.equal(history.url, "/auth");
  assert.equal(takeHandoff({ pathname: "/auth", hash: "" }, history), "");
  assert.equal(takeHandoff({ pathname: "/login", hash: "" }, history), null);
});
