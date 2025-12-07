import { DatasetType } from '../data/dataset_manager'

interface DatasetSelectorProps {
  currentDataset: DatasetType
  onDatasetChange: (dataset: DatasetType) => void
}

export function DatasetSelector({ currentDataset, onDatasetChange }: DatasetSelectorProps) {
  return (
    <select
      id="dataset-select"
      value={currentDataset}
      onChange={(e) => onDatasetChange(e.target.value as DatasetType)}
      className="inline-block px-4 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 rounded text-gray-100 text-sm sm:text-base leading-tight border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer align-top"
    >
      <option value={DatasetType.BOTH}>All Games</option>
      <option value={DatasetType.OLD}>Old Games</option>
      <option value={DatasetType.NEW}>New Games</option>
    </select>
  )
}
