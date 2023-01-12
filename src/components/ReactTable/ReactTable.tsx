import { useMemo } from 'react'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { Column, Row, TableState, useSortBy, useTable } from 'react-table'
import { Flex, Table, Tbody, Td, Th, Thead, Tr, useColorModeValue, useTheme } from '@chakra-ui/react'

type ReactTableProps<T extends {}> = {
  columns: Column<T>[]
  data: T[]
  page?: number
  rowsPerPage?: number
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
      {
        column.canSort && (
          <Flex
            direction={'column'}
          >
            <MdKeyboardArrowUp size={20} fill={column.isSorted ? (column.isSortedDesc ? theme.colors.primary : theme.colors.table.arrow) : theme.colors.table.arrow} aria-label='sorted ascending' style={{position:'absolute'}} />
            <MdKeyboardArrowDown size={20} fill={column.isSorted ? (column.isSortedDesc ? theme.colors.table.arrow : theme.colors.primary) : theme.colors.table.arrow} aria-label='sorted descending' style={{marginTop:10}} />
          </Flex>
        )
      }
    </Flex>
  )
}

export const ReactTable = <T extends {}>({
  columns,
  data,
  page,
  rowsPerPage,
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

  const pageRows = useMemo(() => {
    if (!rowsPerPage || !page) return rows
    return rows.slice(rowsPerPage*(page-1), rowsPerPage*page)
  }, [rows, page, rowsPerPage])

  const renderRows = useMemo(() => {
    return pageRows.map( row => {
      let firstCellFound = false
      prepareRow(row)
      return (
        <Tr
          {...row.getRowProps()}
          tabIndex={row.index}
          layerStyle={'tableRow'}
          onClick={() => onRowClick?.(row)}
          cursor={onRowClick ? 'pointer' : undefined}
        >
          {row.cells.map( (cell, cellIndex) => {
            const isFirstCell = !firstCellFound && cell.column.display !== 'none'
            const isLastCell = cellIndex === row.cells.length-1
            if (isFirstCell) {
              firstCellFound = true
            }
            const sx = isFirstCell ? {borderTopLeftRadius:8, borderBottomLeftRadius:8} : (isLastCell ? {borderTopRightRadius:8, borderBottomRightRadius:8} : {})
            return (
              <Td {...cell.getCellProps()} display={cell.column.display} sx={sx}>
                {cell.render('Cell')}
              </Td>
            )
          })}
        </Tr>
      )
    })
  }, [prepareRow, pageRows, onRowClick])

  return (
    <Table variant='clickable' size={{ base: 'sm', md: 'md' }} {...getTableProps()}>
      {displayHeaders && (
        <Thead>
          {headerGroups.map(headerGroup => {
            let firstColumnFound = false
            return (
              <Tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map( (column, colIndex) => {
                  const isFirstCell = !firstColumnFound && column.display !== 'none'
                  const isLastCell = colIndex === headerGroup.headers.length-1
                  if (isFirstCell) {
                    firstColumnFound = true
                  }
                  const style = isFirstCell ? {paddingLeft:0, paddingRight: 4} : (isLastCell ? {paddingLeft:4, paddingRight: 0} : {paddingLeft:4, paddingRight: 4})
                  return (
                    <Th
                      {...column.getHeaderProps(column.getSortByToggleProps({title: undefined /*remove mouse hover tooltip*/}))}
                      color={'gray.500'}
                      display={column.display}
                      textAlign={column.textAlign}
                      _hover={{ color: column.canSort ? hoverColor : 'gray.500' }}
                      style={style}
                    >
                      <TableHeader column={column} />
                    </Th>
                  )
                })}
              </Tr>
            )
          })}
        </Thead>
      )}
      <Tbody {...getTableBodyProps()}>{renderRows}</Tbody>
    </Table>
  )
}
