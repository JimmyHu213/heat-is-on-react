import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  MEDIA_CONFIG,
  getValidTrainingUrl,
  getHazardIconPath,
  getEventGifPath,
} from "./mediaConfig.js";

test("MEDIA_CONFIG defines English intro video, all 5 event GIFs, and all 5 hazard icons", () => {
  assert.equal(MEDIA_CONFIG.introVideo, "/media/introduction-en.mp4");
  const expectedHazards = ["bushfire", "flood", "stormSurge", "heatwave", "biohazard"];
  for (const id of expectedHazards) {
    assert.equal(MEDIA_CONFIG.eventGifs[id], `/media/events/${id}.gif`);
    assert.equal(MEDIA_CONFIG.hazardIcons[id], `/media/icons/${id}.png`);
  }
});

test("MEDIA_CONFIG defines placeholder video, logo, and copyright properties", () => {
  assert.equal(MEDIA_CONFIG.timeMachineVideo, "/media/time-machine.mp4");
  assert.equal(MEDIA_CONFIG.neshExplainerVideo, "/media/nesh-explainer.mp4");
  assert.equal(
    MEDIA_CONFIG.inspiringTasmaniaLogo,
    "/media/logos/inspiring-tasmania-placeholder.svg"
  );
  assert.equal(MEDIA_CONFIG.utasLogo, "/media/logos/utas-placeholder.svg");
  assert.equal(MEDIA_CONFIG.copyrightText, "© University of Tasmania · The Heat Is On");
});

test("all configured workshop videos and hazard assets exist in the Hosting public directory", () => {
  const paths = [
    MEDIA_CONFIG.introVideo,
    MEDIA_CONFIG.timeMachineVideo,
    MEDIA_CONFIG.neshExplainerVideo,
    ...Object.values(MEDIA_CONFIG.eventGifs),
    ...Object.values(MEDIA_CONFIG.hazardIcons),
    ...Object.values(MEDIA_CONFIG.hazardIntroductions),
  ];
  for (const path of paths) {
    assert.ok(existsSync(new URL(`../../public${path}`, import.meta.url)), `Missing media: ${path}`);
  }
});

test("getValidTrainingUrl accepts https/http URLs and rejects empty, relative, or javascript: URLs", () => {
  assert.equal(
    getValidTrainingUrl("  https://ccs.utas.edu.au/training/heat-is-on  "),
    "https://ccs.utas.edu.au/training/heat-is-on"
  );
  assert.equal(
    getValidTrainingUrl("http://localhost:8080/training"),
    "http://localhost:8080/training"
  );
  assert.equal(getValidTrainingUrl(""), "");
  assert.equal(getValidTrainingUrl("   "), "");
  assert.equal(getValidTrainingUrl(null), "");
  assert.equal(getValidTrainingUrl(undefined), "");
  assert.equal(getValidTrainingUrl("/relative/path"), "");
  assert.equal(getValidTrainingUrl("javascript:alert(1)"), "");
});

test("getHazardIconPath and getEventGifPath return paths for known hazards and null for unknown or prototype keys", () => {
  assert.equal(getHazardIconPath("bushfire"), "/media/icons/bushfire.png");
  assert.equal(getEventGifPath("stormSurge"), "/media/events/stormSurge.gif");
  assert.equal(getHazardIconPath("unknown"), null);
  assert.equal(getEventGifPath("toString"), null);
  assert.equal(getHazardIconPath("__proto__"), null);
  assert.equal(getEventGifPath(null), null);
});
