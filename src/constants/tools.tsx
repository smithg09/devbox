import {
  BsKey,
  BsMarkdown,
  BsGlobe,
  BsShieldLock,
  BsFiletypeSvg,
  BsPersonVcard,
  BsClock,
  BsBox,
  BsRegex,
} from "react-icons/bs";

export const tools = [
  {
    id: "jwt",
    path: "/jwt",
    icon: <BsKey />,
    text: "JWT Tools",
  },
  {
    id: "markdown",
    path: "/markdown",
    icon: <BsMarkdown />,
    text: "Markdown",
  },
  {
    id: "regex",
    path: "/regex",
    icon: <BsRegex />,
    text: "Regex Tester",
  },
  {
    id: "har-viewer",
    path: "/har-viewer",
    icon: <BsGlobe />,
    text: "HAR Viewer",
  },
  {
    id: "cron",
    path: "/cron",
    icon: <BsClock />,
    text: "Cron",
  },
  {
    id: "ssh-keys",
    path: "/ssh-keys",
    icon: <BsShieldLock />,
    text: "SSH Keys",
  },
  {
    id: "svg-preview",
    path: "/svg-preview",
    icon: <BsFiletypeSvg />,
    text: "SVG Preview",
  },
  {
    id: "bundlephobia",
    path: "/bundlephobia",
    icon: <BsBox />,
    text: "Bundle Analyzer",
  },
  {
    id: "ids",
    path: "/ids",
    icon: <BsPersonVcard />,
    text: "ID Generator",
  },
];
