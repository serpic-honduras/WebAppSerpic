
import { Addendum, ChangeOrder } from '@/types/project';

export const calculateModifiedContractAmount = (
  originalAmount: number,
  addendums: Addendum[] = [],
  changeOrders: ChangeOrder[] = []
): number => {
  // Sum all approved addendums
  const approvedAddendumsTotal = addendums
    .filter(addendum => addendum.status === 'Approved')
    .reduce((sum, addendum) => sum + addendum.amount, 0);

  // Sum all approved change orders
  const approvedChangeOrdersTotal = changeOrders
    .filter(changeOrder => changeOrder.status === 'Approved')
    .reduce((sum, changeOrder) => sum + changeOrder.amount, 0);

  return originalAmount + approvedAddendumsTotal + approvedChangeOrdersTotal;
};

export const getApprovedAddendums = (addendums: Addendum[] = []) => {
  return addendums.filter(addendum => addendum.status === 'Approved');
};

export const getApprovedChangeOrders = (changeOrders: ChangeOrder[] = []) => {
  return changeOrders.filter(changeOrder => changeOrder.status === 'Approved');
};
