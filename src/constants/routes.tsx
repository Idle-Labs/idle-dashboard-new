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
const AssetPage = lazyLoadComponent('AssetPage')
const AssetStats = lazyLoadComponent('AssetStats')

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Template />,
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'earn',
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
        /*
        children:[
          {
            path:'yield-tranches',
            element:<Tranches />,
          },
          {
            path:':strategy',
            children:[
              {
                index: true,
                element:<Strategy />
              },
              {
                path:':asset',
                element:<AssetPage />
              },
            ]
          },
        ]
        */
      },
      {
        path: 'stake',
        element: <Staking />
      },
      {
        path: 'stats',
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
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />
      },
    ]
  },
]
