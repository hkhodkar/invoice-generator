import { Invoice, Party } from '../models/invoice.model';

const studio: Party = {
  name: 'Northwind Studio',
  email: 'hello@northwind.design',
  phone: '+1 (415) 555-0142',
  address: '418 Market Street, Suite 200\nSan Francisco, CA 94111\nUnited States',
  taxId: 'EIN 84-2290137',
};

/** A few realistic invoices so the app doesn't open empty on first visit. */
export function createDemoInvoices(): Invoice[] {
  return [
    {
      id: 'demo-brightline',
      number: 'INV-2026-0012',
      status: 'paid',
      issueDate: '2026-10-02',
      dueDate: '2026-10-16',
      currency: 'USD',
      from: { ...studio },
      to: {
        name: 'Brightline Coffee Co.',
        email: 'accounts@brightlinecoffee.com',
        phone: '+1 (503) 555-0187',
        address: '72 SE Water Avenue\nPortland, OR 97214\nUnited States',
        taxId: '',
      },
      items: [
        { description: 'Brand identity refresh', quantity: 1, unitPrice: 2400 },
        { description: 'Packaging label design (per SKU)', quantity: 3, unitPrice: 350 },
        { description: 'Social media template kit', quantity: 1, unitPrice: 600 },
      ],
      taxRate: 8.5,
      discountType: 'percent',
      discount: 5,
      notes: 'Thanks for working with us! Payment via bank transfer within 14 days.',
      createdAt: '2026-10-02T09:12:00.000Z',
      updatedAt: '2026-10-14T16:40:00.000Z',
    },
    {
      id: 'demo-atlas',
      number: 'INV-2026-0013',
      status: 'sent',
      issueDate: '2026-10-28',
      dueDate: '2026-11-11',
      currency: 'EUR',
      from: { ...studio },
      to: {
        name: 'Atlas Logistics GmbH',
        email: 'invoices@atlas-logistics.de',
        phone: '+49 40 555 0193',
        address: 'Am Sandtorkai 41\n20457 Hamburg\nGermany',
        taxId: 'DE 298 451 772',
      },
      items: [
        { description: 'Fleet dashboard – UI design (hours)', quantity: 32, unitPrice: 85 },
        { description: 'Frontend development, Angular (hours)', quantity: 54, unitPrice: 95 },
        { description: 'Usability testing session', quantity: 2, unitPrice: 450 },
      ],
      taxRate: 19,
      discountType: 'amount',
      discount: 250,
      notes: 'Reverse charge may apply. Please quote the invoice number with your payment.',
      createdAt: '2026-10-28T11:05:00.000Z',
      updatedAt: '2026-10-28T11:30:00.000Z',
    },
    {
      id: 'demo-harbor',
      number: 'INV-2026-0014',
      status: 'draft',
      issueDate: '2026-11-16',
      dueDate: '2026-12-16',
      currency: 'GBP',
      from: { ...studio },
      to: {
        name: 'Harbor & Pine Ltd',
        email: 'finance@harborandpine.co.uk',
        phone: '+44 20 7946 0321',
        address: '12 Shoreditch High Street\nLondon E1 6PJ\nUnited Kingdom',
        taxId: 'GB 412 7781 09',
      },
      items: [
        { description: 'Website maintenance – November', quantity: 1, unitPrice: 650 },
        { description: 'Seasonal landing page build', quantity: 1, unitPrice: 1200 },
        { description: 'Hosting & uptime monitoring', quantity: 1, unitPrice: 45 },
      ],
      taxRate: 20,
      discountType: 'percent',
      discount: 0,
      notes: 'Net 30. Bank details are on the attached remittance slip.',
      createdAt: '2026-11-16T14:20:00.000Z',
      updatedAt: '2026-11-16T14:20:00.000Z',
    },
  ];
}
