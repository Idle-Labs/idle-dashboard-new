// import { Portfolio } from 'components/Portfolio/Portfolio'
import { Template } from 'components/Template/Template'
// import { Strategy } from 'components/Strategy/Strategy'
// import { Dashboard } from 'components/Dashboard/Dashboard'
// import { AssetPage } from 'components/AssetPage/AssetPage'

import { lazyLoadComponent } from 'helpers/'
import { RouteObject, Navigate } from 'react-router-dom'

const Stats = lazyLoadComponent('Stats')
const Staking = lazyLoadComponent('Staking')
// const Strategy = lazyLoadComponent('Strategy')
const Tranches = lazyLoadComponent('Tranches')
const Dashboard = lazyLoadComponent('Dashboard')
const Portfolio = lazyLoadComponent('Portfolio')
const AssetPage = lazyLoadComponent('AssetPage')
const AssetStats = lazyLoadComponent('AssetStats')
const CreditVaults = lazyLoadComponent('CreditVaults')

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Template />,
    children: [
      {
        path: 'earn',
        handle: ['prod', 'beta'],
        children: [
          {
            index: true,
            element: <Tranches />
          },
          {
            path: ':asset',
            element: <AssetPage />
          },
        ]
      },
      {
        path: 'credit',
        handle: ['credit'],
        children: [
          {
            index: true,
            element: <CreditVaults />
          },
          {
            path: ':asset',
            element: <AssetPage />
          },
        ]
      },
      {
        path: 'dashboard',
        element: <Portfolio />,
      },
      {
        path: 'stake',
        element: <Staking />
      },
      {
        path: 'stats',
        handle: ['prod', 'beta'],
        children: [
          {
            index: true,
            element: <Stats />
          },
          {
            path: ':asset',
            element: <AssetStats />
          }
        ]
      },
    ]
  },
]
