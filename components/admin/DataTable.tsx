'use client'

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  searchPlaceholder?: string
  pageSize?: number
}

export function DataTable<TData>({
  data,
  columns,
  searchPlaceholder = 'Search…',
  pageSize = 15,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  })

  const { pageIndex, pageSize: size } = table.getState().pagination
  const total = table.getFilteredRowModel().rows.length

  return (
    <div className="data-table-wrap">
      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="table-search">
          <Search size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
          <input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
          {total} row{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span style={{ color: 'var(--color-text-muted)', display: 'flex' }}>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUp size={11} />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDown size={11} />
                          ) : (
                            <ChevronsUpDown size={11} style={{ opacity: 0.4 }} />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}
                >
                  No results found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <span>
          Page {pageIndex + 1} of {table.getPageCount() || 1}
          {' · '}
          {pageIndex * size + 1}–{Math.min((pageIndex + 1) * size, total)} of {total}
        </span>
        <div className="pagination-btns">
          <button className="pag-btn" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>«</button>
          <button className="pag-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹</button>
          {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
            const base = Math.max(0, Math.min(pageIndex - 2, table.getPageCount() - 5))
            const page = base + i
            return (
              <button
                key={page}
                className={`pag-btn${page === pageIndex ? ' active' : ''}`}
                onClick={() => table.setPageIndex(page)}
              >
                {page + 1}
              </button>
            )
          })}
          <button className="pag-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>›</button>
          <button className="pag-btn" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>»</button>
        </div>
      </div>
    </div>
  )
}
