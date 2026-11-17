// src/constants/mediaConfig.js

export function getValidTrainingUrl(rawUrl) {
  if (typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return trimmed;
    }
  } catch {
    return "";
  }
  return "";
}

const envTrainingUrl =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env.VITE_TRAINING_COURSE_URL
    : "";

export const MEDIA_CONFIG = Object.freeze({
  introVideo: "/media/introduction-en.mp4",
  timeMachineVideo: "/media/time-machine.mp4",
  globalScenarioVideo: "/media/global-scenario.mp4",
  neshExplainerVideo: "/media/nesh-explainer.mp4",
  inspiringTasmaniaLogo: "/media/logos/inspiring-tasmania-placeholder.svg",
  utasLogo: "/media/logos/utas-placeholder.svg",
  copyrightText: "© University of Tasmania · The Heat Is On",
  eventGifs: Object.freeze({
    bushfire: "/media/events/bushfire.gif",
    flood: "/media/events/flood.gif",
    stormSurge: "/media/events/stormSurge.gif",
    heatwave: "/media/events/heatwave.gif",
    biohazard: "/media/events/biohazard.gif",
  }),
  hazardIcons: Object.freeze({
    bushfire: "/media/icons/bushfire.svg",
    flood: "/media/icons/flood.svg",
    stormSurge: "/media/icons/stormSurge.svg",
    heatwave: "/media/icons/heatwave.svg",
    biohazard: "/media/icons/biohazard.svg",
  }),
  eventGifAttribution: Object.freeze({
    label: "Animated Noto Emoji · Google",
    url: "https://googlefonts.github.io/noto-emoji-files/",
    licenseLabel: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  }),
  trainingCourseUrl: getValidTrainingUrl(envTrainingUrl),
});

export function getHazardIconPath(hazardId, config = MEDIA_CONFIG) {
  if (typeof hazardId !== "string" || !hazardId) return null;
  const icons = config?.hazardIcons;
  if (!icons || !Object.hasOwn(icons, hazardId)) return null;
  return icons[hazardId] || null;
}

export function getEventGifPath(hazardId, config = MEDIA_CONFIG) {
  if (typeof hazardId !== "string" || !hazardId) return null;
  const gifs = config?.eventGifs;
  if (!gifs || !Object.hasOwn(gifs, hazardId)) return null;
  return gifs[hazardId] || null;
}
