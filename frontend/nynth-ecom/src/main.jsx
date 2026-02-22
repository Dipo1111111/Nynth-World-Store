import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/globals.css";
import { initMonitoring } from "./utils/monitoring";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Forcefully unregister any rogue service workers and clear caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
}
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

initMonitoring();

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);