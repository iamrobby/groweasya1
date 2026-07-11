"use client";

interface Props {
  columns: string[];
  rows: Record<string, string>[];
  emptyMessage?: string;
  maxHeight?: string;
}

export default function DataTable({
  columns,
  rows,
  emptyMessage = "No data to display.",
  maxHeight = "500px",
}: Props) {
  if (!rows.length) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-auto rounded-xl border border-gray-200 bg-white"
      style={{ maxHeight }}
    >
      <table className="min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-700"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="whitespace-nowrap px-4 py-2.5 text-gray-700"
                >
                  {row[col] || (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}