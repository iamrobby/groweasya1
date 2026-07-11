"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CrmRecord } from "@/types/crm";

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

function countBy(records: CrmRecord[], field: keyof CrmRecord) {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const key = r[field]?.trim() || "Unmapped/Blank";
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export default function Analytics({
  records,
  totalSkipped,
}: {
  records: CrmRecord[];
  totalSkipped: number;
}) {
  const statusData = countBy(records, "crm_status");
  const sourceData = countBy(records, "data_source");
  const cityData = countBy(records, "city").slice(0, 6);

  const withValidDate = records.filter(
    (r) => r.created_at && !isNaN(new Date(r.created_at).getTime())
  ).length;
  const dateValidityPct = records.length
    ? Math.round((withValidDate / records.length) * 100)
    : 0;

  const withNotes = records.filter((r) => r.crm_note?.trim()).length;

  const total = records.length + totalSkipped;
  const skipRatePct = total ? Math.round((totalSkipped / total) * 100) : 0;

  if (!records.length) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Import Analytics</h2>

      {/* Quick stat row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat label="Valid Dates" value={`${dateValidityPct}%`} />
        <MiniStat label="Records w/ Notes" value={withNotes} />
        <MiniStat label="Skip Rate" value={`${skipRatePct}%`} />
        <MiniStat label="Unique Cities" value={countBy(records, "city").length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Status distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Lead Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry:{ name: string; value: number }) => `${entry.name}: ${entry.value}`}
              >
                {statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Data source distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Lead Source Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sourceData} layout="vertical">
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top cities Distribution*/}
        <div className="rounded-xl border border-gray-200 bg-white p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-gray-700">
            Top Cities
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cityData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#fb923c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}