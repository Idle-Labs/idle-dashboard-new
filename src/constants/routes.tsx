import { Template } from 'components/Template/Template'
// import { Strategy } from 'components/Strategy/Strategy'
// import { Dashboard } from 'components/Dashboard/Dashboard'
// import { AssetPage } from 'components/AssetPage/AssetPage'

import { lazyLoadComponent } from 'helpers/'
import { RouteObject, Navigate } from 'react-router-dom'

// const Stats = lazyLoadComponent('Stats')
const Strategy = lazyLoadComponent('Strategy')
const Dashboard = lazyLoadComponent('Dashboard')
const AssetPage = lazyLoadComponent('AssetPage')

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Template />,
    children:[
      {
        path:'dashboard',
        // state: {'dashboard'},
        element:<Dashboard />,
      },
      {
        path:'earn',
        children:[
          {
            path:':strategy',
            children:[
              {
                index: true,
                element:<Strategy />,
              },
              {
                path:':asset',
                element:<AssetPage />,
                // children:[
                //   {
                //     path:'stats',
                //     element: <Stats />,
                //   }
                // ]
              },
            ]
          },
        ]
      },
      /*
      {
        path:'stats',
        children:[
          // {
          //   index: true,
          //   element:<ComponentWithProps state={{section:'stats'}} />,
          // },
          // {
          //   path:':asset',
          //   element:<ComponentWithProps state={{section:'stats/asset'}} />,
          // }
        ]
      },
      {
        path:'stake',
        // element:<ComponentWithProps state={{section:'stake'}} />,
        children: [
          {
            path:'vote',
            // element:<ComponentWithProps state={{section:'vote'}} />,
          },
        ]
      },
      */
      {
        index: true,
        element:<Navigate to="/dashboard" replace />
      },
      {
        path: '*',
        element:<Navigate to="/dashboard" replace />
      },
    ]
  },
]
