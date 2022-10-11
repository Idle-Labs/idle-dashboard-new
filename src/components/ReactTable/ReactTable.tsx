import { useMemo } from 'react'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { Column, Row, TableState, useSortBy, useTable } from 'react-table'
import { Flex, Table, Tbody, Td, Th, Thead, Tr, useColorModeValue, useTheme } from '@chakra-ui/react'

type ReactTableProps<T extends {}> = {
  columns: Column<T>[]
  data: T[]
  displayHeaders?: boolean
  onRowClick?: (row: Row<T>) => void
  initialState?: Partial<TableState<{}>>
}

const TableHeader: React.FC<any> = ({column}) => {
  const theme = useTheme()
  return (
    <Flex
      alignItems={'center'}
      layerStyle={'tableHeader'}
      justifyContent={'space-between'}
    >
      {column.render('Header')}
      <Flex
        direction={'column'}
      >
        <MdKeyboardArrowUp size={20} fill={column.isSorted ? (column.isSortedDesc ? theme.colors.primary : theme.colors.table.arrow) : theme.colors.table.arrow} aria-label='sorted ascending' style={{position:'absolute'}} />
        <MdKeyboardArrowDown size={20} fill={column.isSorted ? (column.isSortedDesc ? theme.colors.table.arrow : theme.colors.primary) : theme.colors.table.arrow} aria-label='sorted descending' style={{marginTop:10}} />
      </Flex>
    </Flex>
  )
}

export const ReactTable = <T extends {}>({
  columns,
  data,
  displayHeaders = true,
  onRowClick,
  initialState,
}: ReactTableProps<T>) => {
  const hoverColor = useColorModeValue('black', 'white')
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable<T>(
    {
      columns,
      data,
      initialState,
    },
    useSortBy,
  )

  const renderRows = useMemo(() => {
    return rows.map(row => {
      prepareRow(row)
      return (
        <Tr
          {...row.getRowProps()}
          tabIndex={row.index}
          onClick={() => onRowClick?.(row)}
          cursor={onRowClick ? 'pointer' : undefined}
        >
          {row.cells.map(cell => (
            <Td {...cell.getCellProps()} display={cell.column.display}>
              {cell.render('Cell')}
            </Td>
          ))}
        </Tr>
      )
    })
  }, [prepareRow, rows, onRowClick])

  return (
    <Table variant='clickable' size={{ base: 'sm', md: 'md' }} {...getTableProps()}>
      {displayHeaders && (
        <Thead>
          {headerGroups.map(headerGroup => (
            <Tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <Th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  color={'gray.500'}
                  display={column.display}
                  textAlign={column.textAlign}
                  _hover={{ color: column.canSort ? hoverColor : 'gray.500' }}
                  style={{paddingLeft:4, paddingRight: 4}}
                >
                  <TableHeader column={column} />
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
      )}
      <Tbody {...getTableBodyProps()}>{renderRows}</Tbody>
    </Table>
  )
}
