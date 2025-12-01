import { useState } from 'react'

type CellValue = {
  simple: string | number
  rendered: React.ReactNode
}

type ColumnType = 'string' | 'number'

interface Column {
  header: string
  type: ColumnType
}

interface TableProps {
  columns: Column[]
  rows: CellValue[][]
}

export function Table({ columns, rows }: TableProps) {
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (columnIndex: number) => {
    if (sortColumn === columnIndex) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column, default to ascending
      setSortColumn(columnIndex)
      setSortDirection('desc')
    }
  }

  const sortedRows = [...rows]
  if (sortColumn !== null) {
    sortedRows.sort((a, b) => {
      const aValue = a[sortColumn].simple
      const bValue = b[sortColumn].simple
      const column = columns[sortColumn]

      let comparison = 0
      if (column.type === 'number') {
        comparison = (aValue as number) - (bValue as number)
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b-2 border-gray-700">
          {columns.map((column, index) => (
            <th
              key={index}
              className="p-2 text-left cursor-pointer hover:bg-gray-800 text-gray-100"
              onClick={() => handleSort(index)}
            >
              <div className="flex items-center gap-1">
                <span>{column.header}</span>
                {sortColumn === index && (
                  <span className="text-xs text-gray-300">
                    {sortDirection === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-gray-700 hover:bg-gray-800">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="p-2">
                {cell.rendered}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
