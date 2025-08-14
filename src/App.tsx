import "@mantine/dropzone/styles.css";
import "@mantine/spotlight/styles.css";
import classes from "./App.module.css";

import { Box, Stack } from "@mantine/core";
import { Spotlight } from "@mantine/spotlight";
import { loader as monacoLoader } from "@monaco-editor/react";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ImperativePanelHandle,
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useLocation, useNavigate } from "react-router-dom";

import { BsSearch } from "react-icons/bs";
import { AppRoutes } from "./Components/AppRoutes";
import { Sidebar } from "./Components/Sidebar";
import { APP_CONFIG } from "./constants/app";
import { sidebarTools } from "./constants/sidebar";
import { tools } from "./constants/tools";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useRouteTransition } from "./hooks/useRouteAnim";
import { insertTauriDragRegion } from "./utils/dragRegion";
import { settingsStore } from "./utils/store";

const PANEL_CONFIG = APP_CONFIG.PANEL;

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Route transition animation state
  const { animation, routeLocation, setRouteAnimation } = useRouteTransition();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const panelRef = useRef<ImperativePanelHandle>(null);

  useKeyboardShortcuts();

  const handlePanelCollapse = useCallback(() => {
    setSidebarCollapsed(true);
  }, []);

  const handlePanelExpand = useCallback(() => {
    setSidebarCollapsed(false);
  }, []);

  const spotlightActions = useMemo(
    () =>
      sidebarTools.map(tool => ({
        id: tool.to,
        label: tool.text,
        onClick: () => navigate(tool.to),
        leftSection: tool.icon,
      })),
    [navigate]
  );

  const resizeHandleStyles = useMemo(
    () => ({
      backgroundColor: "light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-8))",
      width: PANEL_CONFIG.resizeHandle.width,
    }),
    []
  );

  useEffect(() => {
    async function init() {
      const update = await check();
      if (update) {
        console.log(`found update ${update.version} from ${update.date} with notes ${update.body}`);
        let downloaded = 0;
        let contentLength = 0;
        await update.downloadAndInstall(event => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength || 0;
              console.log(`started downloading ${event.data.contentLength} bytes`);
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              console.log(`downloaded ${downloaded} from ${contentLength}`);
              break;
            case "Finished":
              console.log("download finished");
              break;
          }
        });

        console.log("update installed");
        await relaunch();
      }
    }

    init();
  }, []);

  useEffect(() => {
    // This is necessary for Tauri to allow dragging the window
    insertTauriDragRegion();

    // Monaco loader setup for production builds
    if (process.env.NODE_ENV === "production") {
      monacoLoader.config({ paths: { vs: "/vs" } });
    }

    if (panelRef.current) {
      panelRef.current.resize(PANEL_CONFIG.sidebar.maxSize);
    }
  }, []);

  // Track recent tools usage on route change
  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === "/settings" || currentPath === "/dashboard") return;
    const tool = tools.find(t => t.path === currentPath);
    if (!tool) return;

    (async () => {
      const existing = (await settingsStore.getTyped("recentTools")) || [];
      const withoutCurrent = existing.filter(item => item.id !== tool.id);
      const updated = [{ id: tool.id, path: tool.path, usedAt: Date.now() }, ...withoutCurrent]
        .sort((a, b) => b.usedAt - a.usedAt)
        .slice(0, 20);
      await settingsStore.updateTyped("recentTools", updated);
    })();
  }, [location.pathname]);

  useEffect(() => {
    if (panelRef.current) {
      if (sidebarCollapsed) {
        panelRef.current.collapse();
      } else {
        panelRef.current.expand();
      }
    }
  }, [sidebarCollapsed]);

  const handleAnimationEnd = useCallback(() => {
    setRouteAnimation(location);
  }, [location, setRouteAnimation]);

  return (
    <Box className={classes.appWrapper} role="application" aria-label="DevBox Developer Tools">
      <PanelGroup direction="horizontal" autoSaveId="devbox-sidebar">
        <Panel
          id="sidebar"
          collapsible
          className={classes.sidebar}
          ref={panelRef}
          collapsedSize={PANEL_CONFIG.sidebar.collapsedSize}
          defaultSize={PANEL_CONFIG.sidebar.defaultSize}
          maxSize={PANEL_CONFIG.sidebar.maxSize}
          minSize={PANEL_CONFIG.sidebar.minSize}
          onCollapse={handlePanelCollapse}
          onExpand={handlePanelExpand}
        >
          <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        </Panel>
        <PanelResizeHandle style={resizeHandleStyles} aria-label="Resize sidebar" />
        <Panel className={classes.featuresWrapper}>
          <Stack
            className={`${classes.features} ${animation}`}
            onAnimationEnd={handleAnimationEnd}
            gap={2}
            h="100%"
          >
            <AppRoutes location={routeLocation} />
          </Stack>
        </Panel>
      </PanelGroup>
      <Spotlight
        shortcut={APP_CONFIG.SPOTLIGHT.SHORTCUTS}
        searchProps={{
          leftSection: <BsSearch />,
          placeholder: APP_CONFIG.SPOTLIGHT.PLACEHOLDER,
          "aria-label": "Search and navigate tools",
        }}
        actions={spotlightActions}
      />
    </Box>
  );
}

export default App;
