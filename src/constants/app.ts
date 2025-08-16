export const APP_CONFIG = {
  PANEL: {
    sidebar: {
      defaultSize: 15,
      maxSize: 20,
      minSize: 10,
      collapsedSize: 5,
    },
    resizeHandle: {
      width: 1,
    },
  },
  ROUTES: {
    DEFAULT: "/jwt",
  },
  SPOTLIGHT: {
    SHORTCUTS: ["/", "mod + f"] as string[],
    PLACEHOLDER: "Jump to",
  },
  NOTIFICATIONS: {
    position: "top-right",
    styles: {
      root: {
        position: "fixed",
        top: 25,
        right: 15,
      },
    },
  },
  GA: {
    MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID,
    FORCE_BEACON: import.meta.env.VITE_GA_FORCE_BEACON,
    DEBUG: import.meta.env.VITE_GA_DEBUG,
  },
} as const;
