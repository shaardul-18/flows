import { Expense, User } from '../types';
import { formatINR } from './math';

export const generateWhatsAppPersonalMessage = (
  expense: Expense,
  recipient: User,
  payer: User,
  customShare?: number,
  dishesNote?: string
): string => {
  const share = customShare !== undefined
    ? customShare
    : (expense.splits.find((s) => s.memberId === recipient.id)?.amount || 0);

  const formattedShare = formatINR(share);
  const formattedTotal = formatINR(expense.amount);
  const noteSnippet = dishesNote ? ` (${dishesNote})` : '';

  return (
    `Hey ${recipient.name.split(' ')[0]}! From our ${expense.title} (${formattedTotal}), ` +
    `your itemized custom share is *${formattedShare}*${noteSnippet}. ` +
    `Please UPI me at *${payer.upiId}* when free! Cheers!`
  );
};

export const generateWhatsAppGroupSummary = (
  expense: Expense,
  payer: User,
  users: User[]
): string => {
  const formattedTotal = formatINR(expense.amount);
  const dateStr = new Date(expense.date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  const memberLines = expense.splits.map((s) => {
    const user = users.find((u) => u.id === s.memberId);
    const name = user ? user.name : s.memberId;
    const isPayer = s.memberId === payer.id;
    const shareAmt = formatINR(s.amount);
    const status = s.isSettled ? '✅ Paid' : '⏳ Pending';
    const pct = s.percentage ? ` (${s.percentage}%)` : '';
    return `• *${name}*${isPayer ? ' (Host)' : ''}: ${shareAmt}${pct} — ${status}`;
  });

  let itemsSection = '';
  if (expense.items && expense.items.length > 0) {
    itemsSection = `\n🍽️ *Dishes & Items:*\n` +
      expense.items.map((i) => `• ${i.quantity}x ${i.name} — ${formatINR(i.price * i.quantity)}`).join('\n') +
      (expense.tax ? `\n• Taxes & Delivery: ${formatINR(expense.tax)} (Proportionally split)` : '') +
      '\n';
  }

  return (
    `🧾 *Split Bill: ${expense.title}*\n` +
    `📅 ${dateStr} | 💳 ${expense.paymentRail} (${expense.upiAccount || 'Cash'})\n` +
    `💰 *Total Amount:* ${formattedTotal}\n` +
    `👤 *Paid by:* ${payer.name}\n` +
    itemsSection +
    `\n👥 *Split Allocation:*\n` +
    memberLines.join('\n') +
    `\n\n⚡ *Instant UPI Settlement:* ${payer.upiId}\n` +
    `Tap & pay via Google Pay, PhonePe, or Paytm.\n` +
    `Tracked automatically with *Flows* ⚡`
  );
};

export const openWhatsApp = (phoneOrText: string, text?: string) => {
  let url = '';
  if (text) {
    // Has phone number and text
    const cleanPhone = phoneOrText.replace(/[^0-9]/g, '');
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  } else {
    // Only text
    url = `https://api.whatsapp.com/send?text=${encodeURIComponent(phoneOrText)}`;
  }
  window.open(url, '_blank');
};
