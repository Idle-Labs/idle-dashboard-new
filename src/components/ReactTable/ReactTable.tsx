import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { Column, Row, TableState, useSortBy, useTable } from 'react-table'
import { Flex, Table, Tbody, Td, Th, Thead, Tr, HStack, useColorModeValue, useTheme } from '@chakra-ui/react'

type ReactTableProps<T extends {}> = {
  columns: Column<T>[]
  data: T[]
  page?: number
  rowsPerPage?: number
  displayHeaders?: boolean
  onRowClick?: (row: Row<T>) => void
  onToggleRow?: (row: Row<T>) => void
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
  onToggleRow,
  initialState,
}: ReactTableProps<T>) => {
  const theme = useTheme()
  const hoverColor = useColorModeValue('black', 'white')
  const [ selectedRow, setSelectedRow ] = useState<any>(null)
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable<T>(
    {
      columns,
      data,
      initialState,
    },
    useSortBy,
  )

  const toggleSelectedRow = useCallback( (row: any) => {
    setSelectedRow( (selectedRow: any) => {
      return selectedRow === row ? null : row
    })
  }, [setSelectedRow])

  useEffect(() => {
    if (onToggleRow){
      return onToggleRow(selectedRow)
    }
  }, [onToggleRow, selectedRow])

  const pageRows = useMemo(() => {
    if (!rowsPerPage || !page) return rows
    return rows.slice(rowsPerPage*(page-1), rowsPerPage*page)
  }, [rows, page, rowsPerPage])

  const renderRows = useMemo(() => {
    return pageRows.map( (row, rowIndex) => {
      let firstCellFound = false
      prepareRow(row)
      const isLastRow = rowIndex === pageRows.length-1
      const rowSx = isLastRow && !selectedRow ? {borderBottom: 0} : {}
      return (
        <React.Fragment
          key={rowIndex}
        >
          <Tr
            {...row.getRowProps()}
            tabIndex={row.index}
            layerStyle={'tableRow'}
            backgroundColor={selectedRow === row ? 'card.bgLight' : 'initial'}
            onClick={() => row.subRows?.length>0 ? toggleSelectedRow(row) : onRowClick?.(row)}
            cursor={onRowClick ? 'pointer' : undefined}
            sx={rowSx}
          >
            {row.cells.map( (cell, cellIndex) => {
              const isFirstCell = !firstCellFound && cell.column.display !== 'none'
              const isLastCell = cellIndex === row.cells.length-1
              if (isFirstCell) {
                firstCellFound = true
              }
              const sx = isFirstCell ? {borderTopLeftRadius:8, borderBottomLeftRadius:8} : (isLastCell ? {borderTopRightRadius:8, borderBottomRightRadius:8} : {})
              return (
                <Td
                  {...cell.getCellProps()}
                  display={cell.column.display}
                  sx={sx}
                  key={cellIndex}
                >
                  <HStack
                    flex={1}
                    width={'full'}
                    justifyContent={'space-between'}
                  >
                    {cell.render('Cell')}
                    {
                      isLastCell && row.subRows?.length>0 && (
                        selectedRow === row ? (
                          <MdKeyboardArrowUp
                            size={24}
                            color={theme.colors.primary}
                          />
                        ) : (
                          <MdKeyboardArrowDown
                            size={24}
                            color={theme.colors.primary}
                          />
                        )
                      )
                    }
                  </HStack>
                </Td>
              )
            })}
          </Tr>
          {
            selectedRow === row && row.subRows.map( (subRow, subRowIndex) => {
              prepareRow(subRow)
              const isLastSubRow = subRowIndex === row.subRows.length-1
              const subRowSx = isLastRow && isLastSubRow ? {borderBottom: 0} : {}
              return (
                <Tr
                  {...subRow.getRowProps()}
                  tabIndex={subRow.index}
                  layerStyle={'tableRow'}
                  backgroundColor={'button.bgHover'}
                  onClick={() => onRowClick?.(subRow)}
                  cursor={onRowClick ? 'pointer' : undefined}
                  sx={subRowSx}
                  key={subRowIndex}
                >
                  {subRow.cells.map( (cell, cellIndex) => {
                    const isFirstCell = !firstCellFound && cell.column.display !== 'none'
                    const isLastCell = cellIndex === subRow.cells.length-1
                    if (isFirstCell) {
                      firstCellFound = true
                    }
                    const sx = isFirstCell ? {borderTopLeftRadius:8, borderBottomLeftRadius:8} : (isLastCell ? {borderTopRightRadius:8, borderBottomRightRadius:8} : {})
                    return (
                      <Td
                        {...cell.getCellProps()}
                        display={cell.column.display}
                        sx={sx}
                        key={cellIndex}
                      >
                        {cell.render('Cell')}
                      </Td>
                    )
                  })}
                </Tr>
              )
            })
          }
        </React.Fragment>
      )
    })
  }, [toggleSelectedRow, selectedRow, prepareRow, theme, pageRows, onRowClick])

  return (
    <Table variant='clickable' size={{ base: 'sm', md: 'md' }} {...getTableProps()}>
      {displayHeaders && (
        <Thead>
          {headerGroups.map( (headerGroup, rowIndex) => {
            let firstColumnFound = false
            return (
              <Tr
                {...headerGroup.getHeaderGroupProps()}
                key={rowIndex}
              >
                {headerGroup.headers.map( (column, colIndex) => {
                  const isFirstCell = !firstColumnFound && column.display !== 'none'
                  const isLastCell = colIndex === headerGroup.headers.length-1
                  if (isFirstCell) {
                    firstColumnFound = true
                  }
                  const style: Record<string, any> = isFirstCell ? {paddingLeft:0, paddingRight: 4} : (isLastCell ? {paddingLeft:4, paddingRight: 0} : {paddingLeft:4, paddingRight: 4})
                  if (column.width){
                    style.width = column.width
                  }
                  return (
                    <Th
                      {...column.getHeaderProps(column.getSortByToggleProps({title: undefined /*remove mouse hover tooltip*/}))}
                      color={'gray.500'}
                      fontWeight={400}
                      display={column.display}
                      textAlign={column.textAlign}
                      _hover={{ color: column.canSort ? hoverColor : 'gray.500' }}
                      style={style}
                      key={colIndex}
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
