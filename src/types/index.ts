export type Currency = 'INR';

export type SplitMethod = 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'ITEMIZED';

export type PaymentRail = 'UPI' | 'CASH' | 'CARD' | 'NET_BANKING';

export type ExpenseCategory =
  | 'Food'
  | 'Dining'
  | 'Transit'
  | 'Groceries'
  | 'Shopping'
  | 'Travel'
  | 'Rent'
  | 'Utilities'
  | 'Entertainment'
  | 'Micro-Leak'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  upiId: string;
  phone?: string;
  isCurrentUser?: boolean;
}

export interface Group {
  id: string;
  name: string;
  category: string;
  icon: string;
  memberIds: string[];
  createdAt: string;
}

export interface ExpenseItem {
  id: string;
  name: string;
  price: number; // in Rupees
  quantity: number;
  assignedMemberIds: string[];
}

export interface SplitParticipant {
  memberId: string;
  amount: number;
  percentage?: number;
  assignedItems?: string[]; // item IDs
  isSettled: boolean;
  settledAt?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number; // in Rupees
  date: string;
  category: ExpenseCategory;
  paymentRail: PaymentRail;
  upiAccount?: string; // e.g. 'HDFC UPI', 'PhonePe', 'ICICI'
  payerId: string;
  groupId?: string;
  splitMethod: SplitMethod;
  splits: SplitParticipant[];
  items?: ExpenseItem[];
  subtotal?: number;
  tax?: number;
  tip?: number;
  discount?: number;
  notes?: string;
  receiptImage?: string;
  status: 'pending' | 'settled' | 'disputed';
  isMicroLeak?: boolean;
}

export interface Settlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  paymentRail: PaymentRail;
  upiReference?: string;
  notes?: string;
  isConfirmed: boolean;
}

export interface SimplifiedDebt {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}
