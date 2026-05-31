"use client";

import { useEffect, useState } from "react";

type Sales = {
  month: string;
  total: number;
};

export default function AnalyticsPage() {
  const [sales, setSales] = useState<Sales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/monthly")
      .then((res) => res.json())
      .then((data) => setSales(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Monthly Sales Report</h1>

      {loading ? (
        <p>Loading sales data...</p>
      ) : (
        <div className="border rounded-xl p-4 shadow-sm space-y-3">
          {sales.map((item) => (
            <div
              key={item.month}
              className="flex justify-between border-b pb-2"
            >
              <span>{item.month}</span>
              <span>${item.total}</span>
            </div>
          ))}

          <div className="flex justify-between font-bold pt-4">
            <span>Total Revenue</span>
            <span>${totalRevenue}</span>
          </div>
        </div>
      )}
    </div>
  );
}