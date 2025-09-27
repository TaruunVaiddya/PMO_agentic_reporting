'use client';

import { useState, ChangeEvent } from 'react';

interface TableData {
  table_id: number;
  sheet_name?: string;
  table_number_in_sheet?: number;
  position?: {
    start_row: number;
    start_col: number;
    end_row: number;
    end_col: number;
  };
  shape: [number, number];
  columns: string[];
  column_types?: Record<string, string>;
  data: (any | null)[][];
  metadata?: {
    density: number;
    total_cells: number;
    data_cells: number;
    detection_method: string;
  };
}

interface UploadResponse {
  message: string;
  file_id: string;
  tables_found: number;
  tables: TableData[];
}

export default function ExcelParserPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setLoading(true);
    setError('');
    setParsedData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const data: UploadResponse = await response.json();
      setParsedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while uploading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Excel Parser</h1>
          <p className="mt-2 text-gray-300">Upload an Excel file to parse and view its data</p>
        </div>

        <div className="bg-gray-800 shadow rounded-lg p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-md
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-gray-600 file:text-gray-200
                  hover:file:bg-gray-500
                  cursor-pointer"
              />
            </div>

            {file && (
              <div className="text-sm text-gray-300">
                Selected file: <span className="font-medium text-white">{file.name}</span>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-400 bg-red-900/50 p-3 rounded border border-red-800">
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md
                hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                transition duration-150 ease-in-out"
            >
              {loading ? 'Uploading...' : 'Upload and Parse'}
            </button>
          </div>
        </div>

        {parsedData && (
          <div className="bg-gray-800 shadow rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Parse Results</h2>
              <p className="text-sm text-gray-400 mt-1">
                File ID: {parsedData.file_id} | Tables found: {parsedData.tables_found}
              </p>
            </div>

            <div className="space-y-8">
              {parsedData?.tables?.map((table) => (
                <div key={table.table_id} className="border border-gray-700 rounded-lg p-4 bg-gray-900">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Table {table.table_id + 1}
                    {table.sheet_name && ` - ${table.sheet_name}`}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Dimensions: {table.shape[0]} rows × {table.shape[1]} columns
                    {table.metadata && ` | Density: ${(table.metadata.density * 100).toFixed(0)}%`}
                  </p>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-800">
                        <tr>
                          {table.columns.map((column, idx) => (
                            <th
                              key={idx}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-gray-900 divide-y divide-gray-700">
                        {table.data.map((row, rowIdx) => (
                          <tr key={rowIdx} className="hover:bg-gray-800">
                            {row.map((cell, colIdx) => (
                              <td
                                key={colIdx}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-300"
                              >
                                {cell?.toString() || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}