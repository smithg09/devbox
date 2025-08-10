import Settings from "@/Components/Settings";
import { tools } from "@/constants/tools";
import loadable from "@loadable/component";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";

const componentMap = {
  jwt: loadable(() => import("../Features/jwt/JWT")) as React.ComponentType,
  markdown: loadable(() => import("../Features/markdown/Markdown")) as React.ComponentType,
  "har-viewer": loadable(() => import("../Features/har/HarViewer")) as React.ComponentType,
  "ssh-keys": loadable(() => import("../Features/ssh/SSH")) as React.ComponentType,
  "svg-preview": loadable(() => import("../Features/svg/Svg")) as React.ComponentType,
  ids: loadable(() => import("../Features/ids/Ids")) as React.ComponentType,
  cron: loadable(() => import("../Features/cron/Cron")) as React.ComponentType,
  bundlephobia: loadable(
    () => import("../Features/bundlephobia/Bundlephobia")
  ) as React.ComponentType,
  regex: loadable(() => import("../Features/regex/RegexAdvanced")) as React.ComponentType,
  rest: loadable(() => import("../Features/rest/Rest")) as React.ComponentType,
  graphiql: loadable(() => import("../Features/graphiql/GraphiQL")) as React.ComponentType,
  epoch: loadable(() => import("../Features/epoch/Epoch")) as React.ComponentType,
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
  return (
    <ErrorBoundary>
      <Routes location={location}>
        <Route path="/" element={<Navigate to="/jwt" replace />} />
        <Route path="/settings" element={<Settings />} />
        {routes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </ErrorBoundary>
  );
}
