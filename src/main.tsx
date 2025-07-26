import "./index.css";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { theme } from "./Theme";
import { APP_CONFIG } from "./constants/app";

const root = createRoot(document.getElementById("root") as Element);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ColorSchemeScript defaultColorScheme="dark" />
      <MantineProvider theme={theme} defaultColorScheme="dark">
        <Notifications
          position={APP_CONFIG.NOTIFICATIONS.position}
          styles={APP_CONFIG.NOTIFICATIONS.styles}
        />
        <App />
      </MantineProvider>
    </BrowserRouter>
  </React.StrictMode>
);
