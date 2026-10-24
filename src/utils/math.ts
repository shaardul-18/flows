import { ExpenseItem, SimplifiedDebt, SplitParticipant } from '../types';

/**
 * Convert Rupees to integer Paisa to eliminate floating point rounding errors
 */
export const toPaisa = (rupees: number): number => {
  return Math.round((rupees || 0) * 100);
};

/**
 * Convert Paisa back to Rupees
 */
export const fromPaisa = (paisa: number): number => {
  return paisa / 100;
};

/**
 * Format currency according to the Indian Rupee locale standards
 * e.g., ₹1,42,850.00
 */
export const formatINR = (amount: number, includeDecimals = true): string => {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
};

/**
 * Compact currency for badges and chips (e.g. ₹84.2k)
 */
export const formatCompactINR = (amount: number): string => {
  if (Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return formatINR(amount);
};

/**
 * Calculate Equal Split among participant IDs
 * Guarantees zero roundoff residue using largest remainder distribution
 */
export const calculateEqualSplit = (
  totalRupees: number,
  memberIds: string[],
  payerId: string
): SplitParticipant[] => {
  if (!memberIds || memberIds.length === 0) return [];

  const totalPaisa = toPaisa(totalRupees);
  const count = memberIds.length;
  const baseSharePaisa = Math.floor(totalPaisa / count);
  const remainderPaisa = totalPaisa % count;

  return memberIds.map((memberId, index) => {
    // Distribute 1 extra paisa to the first `remainderPaisa` participants
    const sharePaisa = baseSharePaisa + (index < remainderPaisa ? 1 : 0);
    const amount = fromPaisa(sharePaisa);
    return {
      memberId,
      amount,
      percentage: Number(((amount / totalRupees) * 100).toFixed(1)),
      isSettled: memberId === payerId,
    };
  });
};

/**
 * Calculate Itemized Split with Proportional Tax, Tip & Fee distribution
 * Mathematical equity guarantee:
 * - Each item's cost is split among its assigned consumers
 * - Shared fees (tax, tip, packaging) are divided in proportion to subtotal consumption
 * - Remaining cents/paisa are distributed by largest fractional remainder
 */
export const calculateItemizedSplit = (
  items: ExpenseItem[],
  taxRupees: number = 0,
  tipRupees: number = 0,
  discountRupees: number = 0,
  allMemberIds: string[],
  payerId: string
): {
  subtotal: number;
  total: number;
  splits: SplitParticipant[];
  memberSubtotals: Record<string, number>;
  memberTaxes: Record<string, number>;
} => {
  // 1. Calculate each member's dish subtotal in Paisa
  const memberSubtotalPaisa: Record<string, number> = {};
  allMemberIds.forEach((id) => (memberSubtotalPaisa[id] = 0));

  let itemsTotalPaisa = 0;

  items.forEach((item) => {
    const itemTotalPaisa = toPaisa(item.price * (item.quantity || 1));
    itemsTotalPaisa += itemTotalPaisa;

    const assigned = item.assignedMemberIds.length > 0 ? item.assignedMemberIds : allMemberIds;
    const basePerPerson = Math.floor(itemTotalPaisa / assigned.length);
    const remainder = itemTotalPaisa % assigned.length;

    assigned.forEach((memberId, idx) => {
      const share = basePerPerson + (idx < remainder ? 1 : 0);
      memberSubtotalPaisa[memberId] = (memberSubtotalPaisa[memberId] || 0) + share;
    });
  });

  const sharedExtraPaisa = toPaisa(taxRupees + tipRupees - discountRupees);
  const finalTotalPaisa = itemsTotalPaisa + sharedExtraPaisa;

  // 2. Distribute shared tax/tip proportionally to each person's subtotal
  const memberExtraPaisa: Record<string, number> = {};
  const fractionalRemainders: { memberId: string; remainder: number }[] = [];
  let allocatedExtraPaisa = 0;

  if (itemsTotalPaisa > 0 && sharedExtraPaisa !== 0) {
    allMemberIds.forEach((id) => {
      const personSubtotal = memberSubtotalPaisa[id] || 0;
      if (personSubtotal > 0) {
        const rawShare = (personSubtotal / itemsTotalPaisa) * sharedExtraPaisa;
        const floorShare = Math.floor(rawShare);
        memberExtraPaisa[id] = floorShare;
        allocatedExtraPaisa += floorShare;
        fractionalRemainders.push({
          memberId: id,
          remainder: rawShare - floorShare,
        });
      } else {
        memberExtraPaisa[id] = 0;
      }
    });

    // Largest remainder method for extra tax/fee paisa
    const diffPaisa = sharedExtraPaisa - allocatedExtraPaisa;
    fractionalRemainders.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < diffPaisa; i++) {
      const luckyId = fractionalRemainders[i % fractionalRemainders.length]?.memberId;
      if (luckyId) {
        memberExtraPaisa[luckyId] = (memberExtraPaisa[luckyId] || 0) + 1;
      }
    }
  } else {
    allMemberIds.forEach((id) => (memberExtraPaisa[id] = 0));
  }

  // 3. Construct splits array
  const splits: SplitParticipant[] = allMemberIds.map((memberId) => {
    const subPaisa = memberSubtotalPaisa[memberId] || 0;
    const extraPaisa = memberExtraPaisa[memberId] || 0;
    const totalPersonPaisa = Math.max(0, subPaisa + extraPaisa);
    const amount = fromPaisa(totalPersonPaisa);
    const grandTotalRupees = fromPaisa(finalTotalPaisa);

    return {
      memberId,
      amount,
      percentage: grandTotalRupees > 0 ? Number(((amount / grandTotalRupees) * 100).toFixed(1)) : 0,
      isSettled: memberId === payerId,
    };
  });

  const memberSubtotals: Record<string, number> = {};
  const memberTaxes: Record<string, number> = {};
  allMemberIds.forEach((id) => {
    memberSubtotals[id] = fromPaisa(memberSubtotalPaisa[id] || 0);
    memberTaxes[id] = fromPaisa(memberExtraPaisa[id] || 0);
  });

  return {
    subtotal: fromPaisa(itemsTotalPaisa),
    total: fromPaisa(finalTotalPaisa),
    splits,
    memberSubtotals,
    memberTaxes,
  };
};

/**
 * Debt Simplification Algorithm
 * Minimizes number of peer transactions across a group of members
 */
export const simplifyDebts = (
  allMemberIds: string[],
  netBalances: Record<string, number> // in Rupees (positive = is owed money, negative = owes money)
): SimplifiedDebt[] => {
  // Convert to integer paisa
  const balances: { id: string; paisa: number }[] = allMemberIds
    .map((id) => ({ id, paisa: toPaisa(netBalances[id] || 0) }))
    .filter((b) => Math.abs(b.paisa) > 0);

  const creditors = balances.filter((b) => b.paisa > 0).sort((a, b) => b.paisa - a.paisa);
  const debtors = balances.filter((b) => b.paisa < 0).sort((a, b) => a.paisa - b.paisa);

  const transactions: SimplifiedDebt[] = [];
  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const debtAmountPaisa = Math.min(-debtor.paisa, creditor.paisa);

    if (debtAmountPaisa > 0) {
      transactions.push({
        fromMemberId: debtor.id,
        toMemberId: creditor.id,
        amount: fromPaisa(debtAmountPaisa),
      });

      debtor.paisa += debtAmountPaisa;
      creditor.paisa -= debtAmountPaisa;
    }

    if (debtor.paisa === 0) i++;
    if (creditor.paisa === 0) j++;
  }

  return transactions;
};
