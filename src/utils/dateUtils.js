// src/utils/dateUtils.js

/**
 * Format a Firestore timestamp or Date object to a readable string
 * @param {Object|Date} timestamp - Firestore timestamp or Date object
 * @param {boolean} includeTime - Whether to include the time in the output
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, includeTime = true) => {
  if (!timestamp) return "N/A";

  // Convert Firestore timestamp to JS Date if needed
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  // Options for date formatting
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  // Add time options if includeTime is true
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return date.toLocaleDateString(undefined, options);
};

/**
 * Calculate the difference between now and a timestamp in a human-readable format
 * @param {Object|Date} timestamp - Firestore timestamp or Date object
 * @returns {string} Time difference (e.g., "2 days ago")
 */
export const getTimeAgo = (timestamp) => {
  if (!timestamp) return "";

  // Convert Firestore timestamp to JS Date if needed
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();

  const seconds = Math.floor((now - date) / 1000);

  // Handle future dates
  if (seconds < 0) {
    return "in the future";
  }

  // Time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  let counter;
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    counter = Math.floor(seconds / secondsInUnit);
    if (counter > 0) {
      return `${counter} ${unit}${counter === 1 ? "" : "s"} ago`;
    }
  }

  return "just now";
};

/**
 * Get today's date as a string in YYYY-MM-DD format
 * @returns {string} Today's date in YYYY-MM-DD format
 */
export const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
