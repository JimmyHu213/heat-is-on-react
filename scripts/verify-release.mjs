import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import assert from "node:assert/strict";

const [project, sha] = process.argv.slice(2);
assert.ok(["heat-is-on", "the-heat-is-on"].includes(project));
const html = await readFile("dist/index.html", "utf8");
const entry = html.match(/<script[^>]*src="(\/assets\/[^"]+\.js)"/)?.[1];
assert.ok(entry, "Expected a Vite entry script");
const localEntry = await readFile("dist" + entry);

async function live(path) {
  const res = await fetch("https://" + project + ".web.app" + path + "?revision=" + sha, { signal: AbortSignal.timeout(15000) });
  assert.ok(res.ok, path + " returned HTTP " + res.status);
  return res;
}

for (let attempt = 1; ; attempt++) {
  try {
    assert.deepEqual(await (await live("/release.json")).json(), { project, sha });
    assert.equal(await (await live("/login")).text(), html);
    assert.ok(localEntry.equals(Buffer.from(await (await live(entry)).arrayBuffer())), "Live JavaScript differs from this build");
    break;
  } catch (error) {
    if (attempt === 6) throw error;
    await setTimeout(5000);
  }
}
console.log("Verified " + project + " at " + sha);
