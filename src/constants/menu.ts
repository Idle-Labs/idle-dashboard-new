import { IconType } from './types'

export type MenuListType = {
  path?: string
  label: string
  icon?: IconType
  onClick?: Function
  iconProps?: Record<string, any>
  labelProps?: Record<string, any>
}

export type MenuItemType = {
  path?: string
  label: string
  icon?: IconType
  onClick?: Function
  children?: MenuListType[]
  iconProps?: Record<string, any>
  labelProps?: Record<string, any>
}

export const menu: MenuItemType[] = [
  {
    path:'dashboard',
    label:'Dashboard'
  },
  {
    label:'Earn',
    children:[
      {
        path:'earn/best-yield',
        label:'Best Yield'
      },
      {
        path:'earn/protected-yield',
        label:'Protected Yield'
      },
      {
        path:'earn/boosted-yield',
        label:'Boosted Yield'
      },
    ]
  },
  {
    path:'stats',
    label:'Stats'
  },
  {
    path:'stake',
    label:'Stake & Vote'
  },
  {
    path:'governance',
    label:'Governance'
  },
]