import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Dispatcher from "./Dispatcher.jsx";
import "./index.css";

const isDispatcher = window.location.pathname.startsWith("/dispatch");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>{isDispatcher ? <Dispatcher /> : <App />}</React.StrictMode>
);
