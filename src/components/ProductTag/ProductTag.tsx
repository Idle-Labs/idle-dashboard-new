import { Tag, TextProps } from '@chakra-ui/react'
import { products, ProductProps } from 'constants/products'
import { Translation } from 'components/Translation/Translation'

type ProductTagProps = {
  type: string | undefined
} & TextProps

export const ProductTag: React.FC<ProductTagProps> = ({ type, ...textProps }) => {
  if (!type) return null
  const foundProduct = products.find( (p: ProductProps) => p.strategies.includes(type) )
  if (!foundProduct) return null
  return (
    <Translation
      px={4}
      py={'6px'}
      component={Tag}
      fontWeight={600}
      color={'primary'}
      sx={{
        borderRadius:8,
        whiteSpace:'nowrap'
      }}
      bg={`tags.${foundProduct.strategy}`}
      translation={`strategies.${foundProduct.strategy}.label`}
      {...textProps}
    />
  )
}