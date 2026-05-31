"use client";

import { useEffect, useState } from "react";

type Tool = {
  id: string;
  name: string;
  status: string;
};

export default function InventoryPage() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tools")
      .then((res) => res.json())
      .then((data) => setTools(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tools Management</h1>

      {loading ? (
        <p>Loading tools...</p>
      ) : (
        <div className="border rounded-xl p-4 shadow-sm">
          {tools.length === 0 ? (
            <p className="text-gray-500">No tools found.</p>
          ) : (
            tools.map((tool) => (
              <div
                key={tool.id}
                className="flex justify-between border-b py-3"
              >
                <span>{tool.name}</span>
                <span className="text-sm text-gray-500">
                  {tool.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}