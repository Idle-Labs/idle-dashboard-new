import { Template } from 'components/Template/Template'
import { Dashboard } from 'components/Dashboard/Dashboard'
import { Strategy } from 'components/Strategy/Strategy'
// import { TestConsumer } from 'components/TestConsumer/TestConsumer'
import { RouteObject, Outlet/*, useParams*/, useLocation } from 'react-router-dom'

const ComponentWithProps = (props:any) => {
  const location = useLocation()
  return (
    <>
      <p>Props: {JSON.stringify(props)}</p>
      <Outlet context={location} />
    </>
  )
}

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
            index: true,
            element:<ComponentWithProps state={{section:'earn'}} />,
          },
          {
            path:':strategy',
            children:[
              {
                index: true,
                element:<Strategy />,
              },
              {
                path:':asset',
                element:<ComponentWithProps state={{section:'earn/strategy/asset'}} />,
                children:[
                  {
                    index: true,
                    element: <ComponentWithProps state={{section:'earn/strategy/asset/earn'}} />,
                  },
                  {
                    path:'stats',
                    element: <ComponentWithProps state={{section:'earn/strategy/asset/stats'}} />,
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
          {
            index: true,
            element:<ComponentWithProps state={{section:'stats'}} />,
          },
          {
            path:':asset',
            element:<ComponentWithProps state={{section:'stats/asset'}} />,
          }
        ]
      },
      {
        path:'stake',
        element:<ComponentWithProps state={{section:'stake'}} />,
        children: [
          {
            path:'vote',
            element:<ComponentWithProps state={{section:'vote'}} />,
          },
        ]
      },
    ]
  },
]
