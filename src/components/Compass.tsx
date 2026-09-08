import React from "react";
import { usePreferences } from "../preferences";
import { ClassicCompass } from "./ClassicCompass";
import { ModernCompass } from "./ModernCompass";
import type { CompassProps } from "./compassShared";

export { COMPASS_SIZE } from "./compassShared";
export type { CompassProps } from "./compassShared";

export const Compass: React.FC<CompassProps> = (props) => {
  const { compassStyle } = usePreferences();
  return compassStyle === "classic" ? <ClassicCompass {...props} /> : <ModernCompass {...props} />;
};
