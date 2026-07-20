import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Dispatcher from "./Dispatcher.jsx";
import Apply from "./Apply.jsx";
import Client from "./Client.jsx";
import CarpetHome from "./CarpetHome.jsx";
import "./index.css";

const path = window.location.pathname;
const isDispatcher = path.startsWith("/dispatch");
const isApply = path.startsWith("/apply");
const isClient = path.startsWith("/book");
const isCarpet = path.startsWith("/carpet");

const Page = isDispatcher ? Dispatcher : isApply ? Apply : isClient ? Client : isCarpet ? CarpetHome : App;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
