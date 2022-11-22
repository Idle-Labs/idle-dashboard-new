import { Stats } from 'components/Stats/Stats'
import { Template } from 'components/Template/Template'
import { Strategy } from 'components/Strategy/Strategy'
import { Dashboard } from 'components/Dashboard/Dashboard'
import { AssetPage } from 'components/AssetPage/AssetPage'
// import { TestConsumer } from 'components/TestConsumer/TestConsumer'
import { RouteObject, Navigate, Outlet/*, useParams*/, useLocation } from 'react-router-dom'

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
          // {
          //   index: true,
          //   element:<ComponentWithProps state={{section:'earn'}} />,
          // },
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
                children:[
                  {
                    path:'stats',
                    element: <Stats />,
                  }
                ]
              },
            ]
          },
        ]
      },
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
      {
        index: true,
        element:<Navigate to="/dashboard" replace />
      },
    ]
  },
]
