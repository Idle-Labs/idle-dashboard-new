import { IconType } from "./types";
import { BsStars } from "react-icons/bs";
import { getLegacyDashboardUrl } from "helpers/";
// import { ProductProps, products } from 'constants/products'

export type MenuListType = {
  path?: string;
  link?: string;
  label: string;
  icon?: IconType;
  onClick?: Function;
  iconPosition?: string;
  iconProps?: Record<string, any>;
  labelProps?: Record<string, any>;
};

export type MenuItemType = MenuListType & {
  color?: string;
  enabledEnvs?: string[];
  children?: MenuListType[];
};

export const menu: MenuItemType[] = [
  {
    path: "earn",
    label: "navBar.earn",
    /*
    children: Object.values(products).map( (product: ProductProps) => ({
      path: `earn/${product.route}`,
      label: product.label as string,
      // color: product.color as string
    }))
    */
  },
  {
    path: "dashboard",
    label: "navBar.dashboard",
  },
  {
    path: "stake",
    label: "navBar.stake",
    icon: BsStars,
    iconPosition: "right",
    iconProps: {
      size: 18,
      color: "orange",
    },
  },
  {
    path: "stats",
    label: "navBar.stats",
  },
  // {
  //   label: 'navBar.gauges',
  //   link: getLegacyDashboardUrl('gauges')
  // },
  {
    label: "navBar.legacyApp",
    link: getLegacyDashboardUrl(""),
  },
  {
    // path:'governance',
    label: "navBar.governance",
    link: "https://www.tally.xyz/gov/eip155:1:0x3D5Fc645320be0A085A32885F078F7121e5E5375",
  },
];
