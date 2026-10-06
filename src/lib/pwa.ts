/**
 * PWA Standalone Detection Utility
 * Determines if the current application session is running inside an installed PWA.
 */
export const isStandalone = (): boolean => {
  if (typeof window === "undefined") return false;

  const isStandaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  return isStandaloneDisplay || isIOSStandalone;
};
