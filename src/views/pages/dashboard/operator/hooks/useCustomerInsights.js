import { useMemo } from 'react';
import { normalizeSearchValue, computeBestMatchScore } from '../utils/searchUtils';

export const useCustomerInsights = (customers, sims, transactions) => {
  return useMemo(() => {
    return customers.map((customer) => {
      const customerTransactions = transactions
        .filter((transaction) => transaction.customerId === customer.id || transaction.customerName === customer.name)
        .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());

      const customerSims = sims.filter((sim) => sim.customerId === customer.id || sim.assignedTo === customer.name);
      const activeSims = customerSims.filter((sim) => String(sim.status || '').toLowerCase() === 'active');
      const lastActivity = customerTransactions[0]?.date || customer.createdAt;

      return {
        customer,
        customerTransactions,
        customerSims,
        activeSims,
        lastActivity,
      };
    });
  }, [customers, sims, transactions]);
};

export const useFilteredCustomerInsights = (customerInsights, frontDeskSearch, frontDeskFilters) => {
  return useMemo(() => {
    const keyword = normalizeSearchValue(frontDeskSearch);
    const hasActivityFilters = frontDeskFilters.withTransactions || frontDeskFilters.noTransactions;
    const hasSimFilters = frontDeskFilters.withActiveSim || frontDeskFilters.noActiveSim;

    return customerInsights
      .map((entry) => {
        const candidateScores = [entry.customer.name, entry.customer.email, entry.customer.phone, entry.customer.idNumber]
          .map((value) => computeBestMatchScore(keyword, value));
        const bestScore = Math.max(...candidateScores, -1);

        return {
          ...entry,
          bestMatchScore: keyword ? bestScore : 0,
        };
      })
      .filter(({ customerTransactions, activeSims, bestMatchScore }) => {
        const textMatches = keyword.length === 0 || bestMatchScore >= 0;

        const activityMatches = !hasActivityFilters
          || (frontDeskFilters.withTransactions && customerTransactions.length > 0)
          || (frontDeskFilters.noTransactions && customerTransactions.length === 0);

        const simMatches = !hasSimFilters
          || (frontDeskFilters.withActiveSim && activeSims.length > 0)
          || (frontDeskFilters.noActiveSim && activeSims.length === 0);

        return textMatches && activityMatches && simMatches;
      })
      .sort((first, second) => {
        if (keyword.length > 0 && second.bestMatchScore !== first.bestMatchScore) {
          return second.bestMatchScore - first.bestMatchScore;
        }
        return new Date(second.lastActivity).getTime() - new Date(first.lastActivity).getTime();
      });
  }, [customerInsights, frontDeskFilters, frontDeskSearch]);
};