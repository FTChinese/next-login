import MobileDetect from "mobile-detect";

export function isMobile(ua: string): boolean {
  const md = new MobileDetect(ua);

  return !!md.mobile();
}
