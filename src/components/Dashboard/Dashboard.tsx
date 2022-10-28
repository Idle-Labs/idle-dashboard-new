import React, { useState } from 'react'
import { Card } from 'components/Card/Card'
import { ContainerProps } from '@chakra-ui/react'
import { HistoryTimeframe } from 'constants/types'
import { RateChart } from 'components/RateChart/RateChart'
import { BalanceChart } from 'components/BalanceChart/BalanceChart'

export const Dashboard: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const [percentChange, setPercentChange] = useState(0)
  return (
    <>
      <Card.Dark>
        <Card.Heading>Titolo Card</Card.Heading>
        <BalanceChart
          assetIds={[]}
          isRainbowChart={false}
          percentChange={percentChange}
          timeframe={HistoryTimeframe.MONTH}
          setPercentChange={setPercentChange}
        />
        <RateChart
          assetIds={[]}
          percentChange={percentChange}
          timeframe={HistoryTimeframe.MONTH}
          setPercentChange={setPercentChange}
        />
      </Card.Dark>
    </>
  )
}
