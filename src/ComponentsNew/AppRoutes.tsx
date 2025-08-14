import Settings from "@/components/Settings";
import { tools } from "@/constants/tools";
import loadable from "@loadable/component";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

const componentMap = {
  jwt: loadable(() => import("../pages/jwt/JWT")) as React.ComponentType,
  escape: loadable(() => import("../pages/escape/BackslashEscape")) as React.ComponentType,
  markdown: loadable(() => import("../pages/markdown/Markdown")) as React.ComponentType,
  "har-viewer": loadable(() => import("../pages/har/HarViewer")) as React.ComponentType,
  "ssh-keys": loadable(() => import("../pages/ssh/SSH")) as React.ComponentType,
  "svg-preview": loadable(() => import("../pages/svg/Svg")) as React.ComponentType,
  ids: loadable(() => import("../pages/ids/Ids")) as React.ComponentType,
  cron: loadable(() => import("../pages/cron/Cron")) as React.ComponentType,
  bundlephobia: loadable(() => import("../pages/bundlephobia/Bundlephobia")) as React.ComponentType,
  regex: loadable(() => import("../pages/regex/RegexAdvanced")) as React.ComponentType,
  rest: loadable(() => import("../pages/rest/Rest")) as React.ComponentType,
  graphiql: loadable(() => import("../pages/graphiql/GraphiQL")) as React.ComponentType,
  epoch: loadable(() => import("../pages/epoch/Epoch")) as React.ComponentType,
  dns: loadable(() => import("../pages/dns/DnsLookup")) as React.ComponentType,
  hmac: loadable(() => import("../pages/hmac/HmacGenerator")) as React.ComponentType,
  "url-parser": loadable(() => import("@/pages/url/UrlParser")) as React.ComponentType,
  "url-encoder": loadable(() => import("@/pages/url/UrlEncoder")) as React.ComponentType,
  "certificate-decoder": loadable(() => import("../pages/x509/X509")) as React.ComponentType,
  "json-formatter": loadable(() => import("../pages/json/JsonFormatter")) as React.ComponentType,
  timezone: loadable(() => import("@/pages/timezone/Timezone")) as React.ComponentType,
  dashboard: loadable(() => import("@/pages/dashboard/Dashboard")) as React.ComponentType,
};
// Dynamically create lazy-loaded components
const routes = tools
  .map(({ path, id }) => ({
    path,
    Component: componentMap[id as keyof typeof componentMap],
  }))
  .filter(route => route.Component);

interface AppRoutesProps {
  location?: any;
}

export function AppRoutes({ location }: AppRoutesProps) {
  const DashboardComponent = componentMap.dashboard;
  return (
    <ErrorBoundary>
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<DashboardComponent />} />
        {routes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </ErrorBoundary>
  );
}
