import { VStack } from "@chakra-ui/react";
import { TABLE_ROWS_PER_PAGE } from "constants/";
import { Pagination } from "components/Pagination/Pagination";
import { ReactTable, ReactTableProps } from "components/ReactTable/ReactTable";
import { useThemeProvider } from "contexts/ThemeProvider";
import React, { useCallback, useMemo, useState } from "react";

export const TableWithPagination = <T extends {}>({
  columns,
  data,
  initialState,
  rowsPerPage = TABLE_ROWS_PER_PAGE
}: ReactTableProps<T>) => {
  const { theme } = useThemeProvider()
  const [page, setPage] = useState<number>(1)

  const totalPages = useMemo(() => {
    return Math.ceil(data.length/rowsPerPage)
  }, [data, rowsPerPage])

  const goBack = useCallback(() => {
    if (!page) return false
    setPage((prevPage: number) => {
      return Math.max(1, prevPage - 1)
    })
    return true
  }, [setPage, page])

  const goNext = useCallback(() => {
    if (page === totalPages) return false
    setPage((prevPage: number) => {
      return Math.min(totalPages, prevPage + 1)
    })
  }, [setPage, page, totalPages])

  return (
    <VStack>
      <ReactTable columns={columns} data={data} page={page} rowsPerPage={rowsPerPage} initialState={initialState} />
        {
          totalPages > 1 && (
            <Pagination
              activePage={page}
              pages={totalPages}
              justifyContent={'center'}
              onPrevArrowClick={() => { if (page) goBack() }}
              onNextArrowClick={() => { if (page < totalPages) goNext() }}
              prevArrowColor={page === 1 ? theme.colors.ctaDisabled : theme.colors.primary}
              nextArrowColor={page === totalPages ? theme.colors.ctaDisabled : theme.colors.primary}
            />
          )
        }
    </VStack>
  )
}