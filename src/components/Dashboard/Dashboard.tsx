import React, { useState } from 'react'
import { Card } from 'components/Card/Card'
import { ContainerProps } from '@chakra-ui/react'
import { HistoryTimeframe } from 'constants/types'
import { BalanceChart } from 'components/BalanceChart/BalanceChart'

export const Dashboard: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const [percentChange, setPercentChange] = useState(0)
  return (
    <>
      <Card.Dark p={0}>
        <Card.Heading m={8}>Titolo Card</Card.Heading>
        <BalanceChart
          assetIds={[]}
          isRainbowChart={false}
          percentChange={percentChange}
          timeframe={HistoryTimeframe.MONTH}
          setPercentChange={setPercentChange}
        />
      </Card.Dark>
    </>
  )
}
