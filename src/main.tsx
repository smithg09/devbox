import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "./index.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { APP_CONFIG } from "./constants/app";
import { theme } from "./theme";

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
