import React from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDateTime } from '@/presentation/views/operator/utils/dateUtils';

export const PerformanceTabView = ({ performanceMetrics }) => {
  return (
    <div className="space-y-4">
      <div className="border border-[#f3f3f3] rounded-xl bg-white p-4">
        <h3 className="text-base font-semibold text-[#1f1f1f]">My Performance</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
          <p className="text-xs text-[#828282]">Transactions Today</p>
          <p className="text-2xl font-semibold text-[#1f1f1f] mt-1">{performanceMetrics.todayTransactions}</p>
        </div>
        <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
          <p className="text-xs text-[#828282]">Transactions (7 days)</p>
          <p className="text-2xl font-semibold text-[#1f1f1f] mt-1">{performanceMetrics.weeklyTransactions}</p>
        </div>
        <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
          <p className="text-xs text-[#828282]">Transactions (Month)</p>
          <p className="text-2xl font-semibold text-[#1f1f1f] mt-1">{performanceMetrics.monthlyTransactions}</p>
        </div>
        <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
          <p className="text-xs text-[#828282]">Success Rate</p>
          <p className="text-2xl font-semibold text-[#1f1f1f] mt-1">{performanceMetrics.completionRate}%</p>
        </div>
      </div>

      <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
        <p className="text-sm font-semibold text-[#1f1f1f]">7-Day Transaction Trend</p>
        <div className="h-64 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceMetrics.dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f3f3"/>
              <XAxis dataKey="day" tick={{ fill: '#828282', fontSize: 12 }} axisLine={{ stroke: '#f3f3f3' }} tickLine={false}/>
              <YAxis allowDecimals={false} tick={{ fill: '#828282', fontSize: 12 }} axisLine={{ stroke: '#f3f3f3' }} tickLine={false}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="total" name="Total" fill="#5b93ff" radius={[4, 4, 0, 0]}/>
              <Bar dataKey="completed" name="Completed" fill="#3ebb7f" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
          <p className="text-sm font-semibold text-[#1f1f1f]">Status Breakdown</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#828282]">Completed</span>
              <span className="text-[#1f1f1f] font-medium">{performanceMetrics.completedTransactions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#828282]">Pending</span>
              <span className="text-[#1f1f1f] font-medium">{performanceMetrics.pendingTransactions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#828282]">Failed</span>
              <span className="text-[#1f1f1f] font-medium">{performanceMetrics.failedTransactions}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#f3f3f3]">
              <span className="text-[#828282]">Total</span>
              <span className="text-[#1f1f1f] font-semibold">{performanceMetrics.totalTransactions}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
          <p className="text-sm font-semibold text-[#1f1f1f]">Operational Snapshot</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#828282]">Active SIMs</span>
              <span className="text-[#1f1f1f] font-medium">{performanceMetrics.activeSimsCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#828282]">New Customers (Month)</span>
              <span className="text-[#1f1f1f] font-medium">{performanceMetrics.monthlyCustomers}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
          <p className="text-sm font-semibold text-[#1f1f1f]">Top Transaction Types</p>
          <div className="mt-3 space-y-2 text-sm">
            {performanceMetrics.topTypes.length === 0 ? (
              <p className="text-[#828282]">No transactions yet.</p>
            ) : (
              performanceMetrics.topTypes.map((item) => (
                <div key={item.type} className="flex items-center justify-between">
                  <span className="text-[#828282] capitalize">{item.type}</span>
                  <span className="text-[#1f1f1f] font-medium">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#f3f3f3] bg-white p-4">
        <p className="text-sm font-semibold text-[#1f1f1f]">Recent Transactions</p>
        {performanceMetrics.recentTransactions.length === 0 ? (
          <p className="text-sm text-[#828282] mt-2">No recent transactions.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {performanceMetrics.recentTransactions.map((transaction) => (
              <div key={`perf-${transaction.id}`} className="rounded-md border border-[#f3f3f3] p-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-[#1f1f1f] capitalize">{String(transaction.type || 'transaction').replace(/_/g, ' ')} ({transaction.status || 'unknown'})</p>
                  <p className="text-xs text-[#828282]">{formatDateTime(transaction.date)}</p>
                </div>
                <p className="text-xs text-[#828282] mt-1">Customer: {transaction.customerName || 'N/A'} • SIM: {transaction.iccid || 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};