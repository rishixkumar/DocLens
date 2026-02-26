/**
 * DocLens React Application Entry Point
 *
 * Renders the root App component into the DOM.
 * Loads PDF.js for client-side PDF parsing.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import "./utils/pdfLoader";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
