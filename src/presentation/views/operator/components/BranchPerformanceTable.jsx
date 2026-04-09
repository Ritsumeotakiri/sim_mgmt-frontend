import React from 'react';

export const BranchPerformanceTable = ({ branchPerformance }) => {
  return (
    <div className="border border-[#f3f3f3] rounded-xl bg-white p-4">
      <h3 className="text-base font-semibold text-[#1f1f1f] mb-4">Branch Performance</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-[#828282] border-b border-[#f3f3f3]">
              <th className="py-2 px-3 font-medium">Branch</th>
              <th className="py-2 px-3 font-medium">Operators</th>
              <th className="py-2 px-3 font-medium">SIM Sold</th>
              <th className="py-2 px-3 font-medium">Revenue</th>
              <th className="py-2 px-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branchPerformance.map((row) => (
              <tr key={row.branch} className="border-b border-[#f3f3f3]">
                <td className="py-2 px-3">{row.branch}</td>
                <td className="py-2 px-3">{row.operators}</td>
                <td className="py-2 px-3">{row.simSold}</td>
                <td className="py-2 px-3">${Number(row.revenue).toFixed(2)}</td>
                <td className="py-2 px-3">{row.actions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
