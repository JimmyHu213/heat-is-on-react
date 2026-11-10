# Firebase Auth + Firestore emulators (Java + firebase-tools), no host install needed.
FROM node:24-trixie-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends openjdk-21-jre-headless \
 && rm -rf /var/lib/apt/lists/*

ARG FIREBASE_TOOLS_VERSION=15.35.0
RUN npm install -g firebase-tools@${FIREBASE_TOOLS_VERSION} && npm cache clean --force

# Run as the image's `node` user (uid 1000) so exported data on the bind mount
# is owned by the host user, and pre-download the emulator binaries into its cache.
RUN mkdir -p /app && chown node:node /app
USER node
ENV HOME=/home/node
WORKDIR /home/node
RUN firebase setup:emulators:firestore && firebase setup:emulators:ui && rm -f *-debug.log

WORKDIR /app
EXPOSE 4000 4400 4500 8080 9099 9150
