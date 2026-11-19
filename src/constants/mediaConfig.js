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
  inspiringTasmaniaLogo: "/media/logos/inspiring-tasmania.png",
  utasLogo: "/media/logos/utas-climate-rankings-2026.png",
  loginCover: "/media/adaptania-map.jpg",
  copyrightText: "© University of Tasmania · The Heat Is On",
  eventGifs: Object.freeze({
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
    bushfire: "/media/icons/bushfire.png",
    flood: "/media/icons/flood.png",
    stormSurge: "/media/icons/stormSurge.png",
    heatwave: "/media/icons/heatwave.png",
    biohazard: "/media/icons/biohazard.png",
    mystery: "/media/icons/mystery.png",
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
