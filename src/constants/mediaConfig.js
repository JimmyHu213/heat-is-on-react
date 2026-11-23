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
  neshExplainerVideo: "/media/nesh-explainer.mp4",
  inspiringTasmaniaLogo: "/media/v1/logos/inspiring-tasmania.webp",
  utasLogo: "/media/v1/logos/utas.webp",
  loginCover: "/media/v1/adaptania-1200.webp",
  loginCoverSmall: "/media/v1/adaptania-640.webp",
  copyrightText: "© University of Tasmania · The Heat Is On",
  eventAnimations: Object.freeze({
    bushfire: "/media/v1/events/bushfire.webp",
    flood: "/media/v1/events/flood.webp",
    stormSurge: "/media/v1/events/stormSurge.webp",
    heatwave: "/media/v1/events/heatwave.webp",
    biohazard: "/media/v1/events/biohazard.webp",
  }),
  eventGifs: Object.freeze({
    mystery: "/media/events/mystery.gif",
    bushfire: "/media/events/bushfire.gif",
    flood: "/media/events/flood.gif",
    stormSurge: "/media/events/stormSurge.gif",
    heatwave: "/media/events/heatwave.gif",
    biohazard: "/media/events/biohazard.gif",
  }),
  hazardIntroductions: Object.freeze({
    bushfire: "/media/introductions/bushfire.png",
    flood: "/media/introductions/flood.png",
    stormSurge: "/media/introductions/stormSurge.png",
    heatwave: "/media/introductions/heatwave.png",
    biohazard: "/media/introductions/biohazard.png",
  }),
  hazardIcons: Object.freeze({
    bushfire: "/media/v1/icons/bushfire.webp",
    flood: "/media/v1/icons/flood.webp",
    stormSurge: "/media/v1/icons/stormSurge.webp",
    heatwave: "/media/v1/icons/heatwave.webp",
    biohazard: "/media/v1/icons/biohazard.webp",
    mystery: "/media/v1/icons/mystery.webp",
  }),
  // These GIFs were supplied with the workshop assets, not the Noto placeholders.
  eventGifAttribution: null,
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
