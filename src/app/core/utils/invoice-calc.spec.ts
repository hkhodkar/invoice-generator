import { calculateTotals, isOverdue, lineTotal, roundMoney } from './invoice-calc';

describe('invoice calculations', () => {
  const items = [
    { quantity: 2, unitPrice: 150 },
    { quantity: 3, unitPrice: 49.99 },
  ];

  it('rounds money to two decimals', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('multiplies quantity by unit price for a line', () => {
    expect(lineTotal({ quantity: 3, unitPrice: 49.99 })).toBe(149.97);
    expect(lineTotal({ quantity: 1.5, unitPrice: 80 })).toBe(120);
  });

  it('treats empty or invalid numbers as zero', () => {
    expect(lineTotal({ quantity: NaN, unitPrice: 10 })).toBe(0);
    expect(lineTotal({ quantity: null as unknown as number, unitPrice: 10 })).toBe(0);
  });

  it('calculates subtotal, tax and total without a discount', () => {
    expect(calculateTotals(items, 10, 'percent', 0)).toEqual({
      subtotal: 449.97,
      discount: 0,
      tax: 45,
      total: 494.97,
    });
  });

  it('applies a percentage discount before tax', () => {
    const totals = calculateTotals([{ quantity: 1, unitPrice: 1000 }], 20, 'percent', 10);
    expect(totals.discount).toBe(100);
    expect(totals.tax).toBe(180);
    expect(totals.total).toBe(1080);
  });

  it('applies a fixed discount before tax', () => {
    const totals = calculateTotals([{ quantity: 4, unitPrice: 250 }], 19, 'amount', 250);
    expect(totals.discount).toBe(250);
    expect(totals.tax).toBe(142.5);
    expect(totals.total).toBe(892.5);
  });

  it('never lets a discount make the total negative', () => {
    expect(calculateTotals([{ quantity: 1, unitPrice: 100 }], 0, 'amount', 500).total).toBe(0);
    expect(calculateTotals([{ quantity: 1, unitPrice: 100 }], 0, 'percent', 150).total).toBe(0);
  });

  it('returns zeros for an invoice with no items', () => {
    expect(calculateTotals([], 20, 'percent', 10)).toEqual({ subtotal: 0, discount: 0, tax: 0, total: 0 });
  });

  describe('isOverdue', () => {
    const today = new Date(2026, 10, 17);

    it('flags sent invoices past their due date', () => {
      expect(isOverdue({ status: 'sent', dueDate: '2026-11-16' }, today)).toBe(true);
    });

    it('is not overdue on the due date itself', () => {
      expect(isOverdue({ status: 'sent', dueDate: '2026-11-17' }, today)).toBe(false);
    });

    it('ignores drafts and paid invoices', () => {
      expect(isOverdue({ status: 'draft', dueDate: '2026-01-01' }, today)).toBe(false);
      expect(isOverdue({ status: 'paid', dueDate: '2026-01-01' }, today)).toBe(false);
    });
  });
});
