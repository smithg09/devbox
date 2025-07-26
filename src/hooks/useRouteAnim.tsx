import { useCallback, useEffect, useState } from "react";
import { useLocation, Location } from "react-router-dom";

export const useRouteTransition = () => {
  const location = useLocation();
  const [animation, setAnimation] = useState("transitionIn");
  const [routeLocation, setRouteLocation] = useState(location);

  useEffect(() => {
    if (location.pathname !== routeLocation.pathname) {
      setAnimation("transitionOut");
    }
  }, [location, routeLocation]);

  const setRouteAnimation = useCallback(
    (newLocation: Location) => {
      if (animation === "transitionOut") {
        setRouteLocation(newLocation);
        setAnimation("transitionIn");
      }
    },
    [animation]
  );

  return {
    animation,
    routeLocation,
    setRouteAnimation,
  };
};
