import React from "react";
import loadable from "@loadable/component";
import { Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import { tools } from "@/constants/tools";

const componentMap = {
  jwt: loadable(() => import("../Features/jwt/JWT")) as React.ComponentType,
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
        {routes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Routes>
    </ErrorBoundary>
  );
}
