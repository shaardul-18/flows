import * as XLSX from 'xlsx';
import { Expense, Settlement, User } from '../types';
import { formatINR } from './math';

export const exportToExcel = (
  expenses: Expense[],
  settlements: Settlement[],
  users: User[],
  currentUser: User
) => {
  const wb = XLSX.utils.book_new();

  // 1. Transactions Ledger Sheet
  const txData = expenses.map((exp) => {
    const payer = users.find((u) => u.id === exp.payerId)?.name || 'Unknown';
    const mySplit = exp.splits.find((s) => s.memberId === currentUser.id);

    return {
      'Date': new Date(exp.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      'Description': exp.title,
      'Category': exp.category,
      'Payment Rail': exp.paymentRail,
      'Account / VPA': exp.upiAccount || 'Cash',
      'Total Amount (₹)': exp.amount,
      'Paid By': payer,
      'Your Share (₹)': mySplit ? mySplit.amount : 0,
      'Split Method': exp.splitMethod,
      'Status': exp.status.toUpperCase(),
      'Notes': exp.notes || '',
    };
  });
  const wsTx = XLSX.utils.json_to_sheet(txData);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions Ledger');

  // 2. Itemized Splits Sheet
  const splitRows: any[] = [];
  expenses.forEach((exp) => {
    exp.splits.forEach((split) => {
      const member = users.find((u) => u.id === split.memberId)?.name || split.memberId;
      splitRows.push({
        'Expense Date': new Date(exp.date).toLocaleDateString('en-IN'),
        'Expense Title': exp.title,
        'Total Bill (₹)': exp.amount,
        'Participant': member,
        'Share Amount (₹)': split.amount,
        'Share (%)': split.percentage ? `${split.percentage}%` : 'N/A',
        'Settlement Status': split.isSettled ? 'SETTLED' : 'UNPAID',
        'Settled Date': split.settledAt ? new Date(split.settledAt).toLocaleDateString('en-IN') : '-',
      });
    });
  });
  const wsSplits = XLSX.utils.json_to_sheet(splitRows);
  XLSX.utils.book_append_sheet(wb, wsSplits, 'Itemized Splits');

  // 3. Peer Settlements Sheet
  const settlementRows = settlements.map((s) => {
    const from = users.find((u) => u.id === s.fromMemberId)?.name || s.fromMemberId;
    const to = users.find((u) => u.id === s.toMemberId)?.name || s.toMemberId;
    return {
      'Date': new Date(s.date).toLocaleDateString('en-IN'),
      'Payer (From)': from,
      'Recipient (To)': to,
      'Amount (₹)': s.amount,
      'Method': s.paymentRail,
      'UPI Ref / Txn ID': s.upiReference || 'N/A',
      'Notes': s.notes || '',
    };
  });
  const wsSettlements = XLSX.utils.json_to_sheet(settlementRows);
  XLSX.utils.book_append_sheet(wb, wsSettlements, 'Settlement Records');

  // Write file
  const filename = `Flows_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

export const exportToCSV = (expenses: Expense[], users: User[]) => {
  const headers = ['Date', 'Title', 'Category', 'Payment Rail', 'Total Amount', 'Paid By', 'Status'];
  const rows = expenses.map((exp) => {
    const payer = users.find((u) => u.id === exp.payerId)?.name || 'Unknown';
    return [
      `"${new Date(exp.date).toLocaleDateString('en-IN')}"`,
      `"${exp.title.replace(/"/g, '""')}"`,
      `"${exp.category}"`,
      `"${exp.paymentRail}"`,
      exp.amount,
      `"${payer}"`,
      `"${exp.status.toUpperCase()}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Flows_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
