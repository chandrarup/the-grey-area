import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedAdmin, localPreviewEnabled } from "./policy";
test("administrator access fails closed until explicitly configured", () => {
  assert.equal(isAllowedAdmin("alex@example.com", undefined), false);
  assert.equal(isAllowedAdmin("alex@example.com", ""), false);
  assert.equal(isAllowedAdmin(undefined, "alex@example.com"), false);
  assert.equal(
    isAllowedAdmin("alex@example.com.attacker.test", "alex@example.com"),
    false,
  );
  assert.equal(
    isAllowedAdmin("other@example.com", "alex@example.com,owner@example.com"),
    false,
  );
  assert.equal(
    isAllowedAdmin("ALEX@example.com", " owner@example.com, alex@example.com "),
    true,
  );
});
test("demo identities cannot open a production build even if the flag is accidentally set", () => {
  assert.equal(
    localPreviewEnabled({ NODE_ENV: "production", DEV_IDENTITY: "true" }),
    false,
  );
  assert.equal(
    localPreviewEnabled({ NODE_ENV: "test", DEV_IDENTITY: "true" }),
    false,
  );
  assert.equal(
    localPreviewEnabled({ NODE_ENV: "development", DEV_IDENTITY: "false" }),
    false,
  );
  assert.equal(
    localPreviewEnabled({ NODE_ENV: "development", DEV_IDENTITY: "true" }),
    true,
  );
});
