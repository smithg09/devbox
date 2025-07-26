export const APP_CONFIG = {
  PANEL: {
    sidebar: {
      defaultSize: 5,
      maxSize: 20,
      minSize: 8,
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
} as const;
