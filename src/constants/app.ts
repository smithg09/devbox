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
} as const;
