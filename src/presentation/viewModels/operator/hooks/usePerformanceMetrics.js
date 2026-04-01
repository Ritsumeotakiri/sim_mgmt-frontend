import { useMemo } from 'react';

export const usePerformanceMetrics = (customers, sims, transactions) => {
  return useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const allTransactions = Array.isArray(transactions) ? transactions : [];
    const withValidDate = allTransactions.filter((transaction) => !Number.isNaN(new Date(transaction.date).getTime()));

    const completedStatuses = ['completed', 'success', 'successful'];
    const pendingStatuses = ['pending', 'processing', 'in_progress'];
    const failedStatuses = ['failed', 'rejected', 'cancelled', 'canceled', 'error'];

    const totalTransactions = allTransactions.length;
    const completedTransactions = allTransactions.filter((transaction) => completedStatuses.includes(String(transaction.status || '').toLowerCase())).length;
    const pendingTransactions = allTransactions.filter((transaction) => pendingStatuses.includes(String(transaction.status || '').toLowerCase())).length;
    const failedTransactions = allTransactions.filter((transaction) => failedStatuses.includes(String(transaction.status || '').toLowerCase())).length;

    const todayTransactions = withValidDate.filter((transaction) => new Date(transaction.date) >= startOfToday).length;
    const weeklyTransactions = withValidDate.filter((transaction) => new Date(transaction.date) >= sevenDaysAgo).length;
    const monthlyTransactions = withValidDate.filter((transaction) => new Date(transaction.date) >= startOfMonth).length;

    const monthlyCustomers = (Array.isArray(customers) ? customers : []).filter((customer) => {
      const createdAt = new Date(customer.createdAt);
      return !Number.isNaN(createdAt.getTime()) && createdAt >= startOfMonth;
    }).length;

    const activeSimsCount = (Array.isArray(sims) ? sims : []).filter((sim) => String(sim.status || '').toLowerCase() === 'active').length;

    const completionRate = totalTransactions > 0 ? Math.round((completedTransactions / totalTransactions) * 100) : 0;

    const typeCounts = allTransactions.reduce((accumulator, transaction) => {
      const key = String(transaction.type || 'other').toLowerCase();
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const topTypes = Object.entries(typeCounts)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3)
      .map(([type, count]) => ({
        type: type.replace(/_/g, ' '),
        count,
      }));

    const recentTransactions = [...withValidDate]
      .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
      .slice(0, 5);

    const dailyTrend = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      day.setHours(0, 0, 0, 0);

      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const dayTransactions = withValidDate.filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= day && transactionDate < nextDay;
      });

      const dayCompleted = dayTransactions.filter((transaction) => completedStatuses.includes(String(transaction.status || '').toLowerCase())).length;

      return {
        day: `${day.getMonth() + 1}/${day.getDate()}`,
        total: dayTransactions.length,
        completed: dayCompleted,
      };
    });

    return {
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      todayTransactions,
      weeklyTransactions,
      monthlyTransactions,
      monthlyCustomers,
      activeSimsCount,
      completionRate,
      topTypes,
      recentTransactions,
      dailyTrend,
    };
  }, [customers, sims, transactions]);
};