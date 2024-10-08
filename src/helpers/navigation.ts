import { routes } from "constants/routes";
import { menu, MenuItemType } from "constants/menu";
import type { Asset, AssetId } from "constants/types";
import { LEGACY_DASHBOARD_URL } from "constants/vars";
import { isEmpty } from "./utilities";

export function getRoutePath(path: string, params: string[] = []): string {
  const route =
    path === "/"
      ? routes[0]
      : routes[0].children?.find((route) => route.path === path);
  if (!route || !route.path) return "/";
  return `/${route.path.replace(/\/$/, "")}${
    params.length > 0 ? "/" + params.join("/") : ""
  }`;
}

export function getLegacyDashboardUrl(section: string) {
  return `${LEGACY_DASHBOARD_URL}${section}`;
}

export function checkMenuItemEnv(menuItem: MenuItemType, environment: string) {
  return (
    isEmpty(menuItem.enabledEnvs) ||
    menuItem?.enabledEnvs?.includes(environment)
  );
}

export function checkMenuItemEnabled(path: string, environment: string) {
  const menuItem = menu.find(
    (m: MenuItemType) => m.path?.toLowerCase() === path.toLowerCase()
  );
  if (!menuItem) return false;
  return checkMenuItemEnv(menuItem, environment);
}

export function checkSectionEnabled(path: string, environment?: string) {
  return (
    !!routes[0].children?.find(
      (route) => route.path?.toLowerCase() === path.toLowerCase()
    ) &&
    (!environment || checkMenuItemEnabled(path, environment))
  );
}

export function getVaultPath(type: string, assetId: AssetId) {
  return `/earn/${assetId}`;
}

export function getAssetPath(asset: Asset) {
  return `/earn/${asset.id}`;
}

export function openWindow(url: string) {
  return window.open(url, "_blank", "noopener");
}
