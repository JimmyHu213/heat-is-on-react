import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { takeHandoff } from "./contexts/ccsAccess";
import { exchangeCcsToken } from "./contexts/ccsSession";

const root = ReactDOM.createRoot(document.getElementById("root"));
let handoff = Promise.resolve();

function renderApp(handoffUid) {
  root.render(<React.StrictMode><App handoffUid={handoffUid} /></React.StrictMode>);
}

function handleHandoff() {
  const token = takeHandoff(window.location, window.history);
  if (token === null) return false;
  root.render(null);
  const pending = handoff.then(() => exchangeCcsToken(token)).catch(() => null);
  handoff = pending;
  pending.then(uid => {
    if (handoff === pending) renderApp(uid);
  });
  return true;
}

window.addEventListener("hashchange", () => {
  if (window.location.hash) handleHandoff();
});
if (!handleHandoff()) renderApp(null);
