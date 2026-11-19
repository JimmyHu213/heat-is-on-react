import { readFile, writeFile } from "node:fs/promises";
import { build } from "vite";

const [project, configFile, sha] = process.argv.slice(2);
if (!["heat-is-on", "the-heat-is-on"].includes(project) || !/^[a-f0-9]{40}$/.test(sha ?? "")) {
  throw new Error("Expected a known Firebase release project and full Git commit SHA");
}

const config = JSON.parse(await readFile(configFile, "utf8"));
if (config.projectId !== project || config.authDomain !== project + ".firebaseapp.com" ||
    !/^\d+$/.test(config.messagingSenderId) || !config.appId?.startsWith("1:" + config.messagingSenderId + ":web:")) {
  throw new Error("Hosting web configuration does not match the deployment project");
}

const settings = {
  API_KEY: config.apiKey, APP_ID: config.appId, AUTH_DOMAIN: config.authDomain,
  PROJECT_ID: project, STORAGE_BUCKET: config.storageBucket, MESSAGING_SENDER_ID: config.messagingSenderId,
};
for (const [key, value] of Object.entries(settings)) {
  if (typeof value !== "string" || !value) throw new Error("Missing Firebase setting " + key);
  process.env["VITE_FIREBASE_" + key] = value;
}
process.env.VITE_FIREBASE_MEASUREMENT_ID = config.measurementId ?? "";
process.env.VITE_USE_FIREBASE_EMULATOR = "false";
await build({ envFile: false });
await writeFile("dist/release.json", JSON.stringify({ project, sha }) + "\n");
