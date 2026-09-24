// Copy and FAQs for the /solutions/* pages. Body strings are trusted HTML: a string starting with "<" renders as-is
// (lists), anything else is wrapped in a <p>.

export type Faq = { q: string; a: string };
export type Solution = {
  slug: string;
  h1: string;
  answer: string;
  sections: { h2: string; body: string[] }[];
  leadsTo: { label: string; href: string };
  faqs: Faq[];
};

// The four engagement steps, lead sentence then detail. Home shows the lead sentences only.
export const buildSteps: [string, string][] = [
  ['A call about how the work happens today.', 'Bring the forms, registers or spreadsheets.'],
  ['A fixed written scope and price.', 'Nothing starts until you agree to it.'],
  ['Weekly progress you can click through.', 'You see it take shape, so there are no surprises at launch.'],
  ['Support and changes after launch.', 'The people who built it keep it running.'],
];
const stepsHtml = `<ol class="steps-list">${buildSteps.map(([lead, rest]) => `<li><strong>${lead}</strong> ${rest}</li>`).join('')}</ol>`;

export const faqSchema = (items: Faq[]) => ({
  '@type': 'FAQPage',
  mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
});

export const solutions: Solution[] = [
  {
    slug: 'pharma-distributor-ordering',
    h1: 'Online ordering for pharma distributors',
    answer: "A pharma distributor can stop retyping retailer orders by giving retailers an ordering app under the distributor's own name. Each order arrives as a GST bill in the distributor's system, ready to pack.",
    sections: [
      {
        h2: 'The problem with WhatsApp and phone orders',
        body: [
          'Most pharma distributors still take orders the same way. A medical shop sends a WhatsApp message, a photo of a handwritten list or a voice note, or simply calls the office. Someone at the counter then reads each one and types it into Marg or whatever billing software the business runs on.',
          'So every order is written twice, once by the retailer and once by your staff. Quantities get misread, a strip becomes a box, and the wrong pack size or batch goes on the bill. The shop finds out when the parcel arrives, and the return and credit note cost more than the order was worth.',
          'Orders sent after the office closes sit in a phone until the next morning. On a busy day some are missed completely, and the shop quietly orders from someone else.',
        ],
      },
      {
        h2: 'What an ordering app changes',
        body: [
          'With an ordering app, the retailer places the order themselves. They search your product list, see what is in stock right now, and see their own rates and schemes instead of a general price list.',
          'The order reaches you as a GST bill in your system. Your staff check it, pack it and dispatch it. Nobody retypes anything, so the mistakes that come from reading messages and notes go away.',
          'Retailers can order late at night or on a Sunday. The order waits for you in the morning, complete and in the right format.',
        ],
      },
      {
        h2: 'What to look for',
        body: [
          'If you are comparing ordering apps, check these before you sign up:',
          '<ul><li>It works on the basic Android phones your retailers already carry, and on a web link for shops that will not install an app.</li><li>It carries your name, not the vendor\'s. Retailers are ordering from you.</li><li>It shows live stock and applies your rates and schemes for each retailer.</li><li>It fits the billing software you already use, so your accounts and GST filing stay as they are.</li><li>Support answers during your working hours, in Indian time.</li></ul>',
          'Ask about collections too. Seeing what each shop owes, and following up without printed ledgers, matters as much as taking the order.',
        ],
      },
      {
        h2: 'How Pharmulo does it',
        body: [
          'Pharmulo is the ordering app we built and run at Adiviath for pharma wholesalers and distributors. Retailers order from their phone under your name, and each order opens as a GST bill with no retyping. Stock, collections and supplier payments run in the same place.',
          'Read more on the <a class="link" href="/products/pharmulo">Pharmulo page</a> or go straight to <a class="link" href="https://pharmulo.com" rel="noopener">pharmulo.com</a>. If your business needs something Pharmulo does not do, we can build it: see <a class="link" href="/solutions/distributor-software">custom software for distributors</a>.',
        ],
      },
    ],
    leadsTo: { label: 'See Pharmulo', href: '/products/pharmulo' },
    faqs: [
      { q: 'Do retailers need to install anything?', a: 'Retailers use an app or a web link on their phone.' },
      { q: 'Can we keep using our existing billing software?', a: 'Yes. Orders arrive as bills in the system you use; tell us which one and we confirm on the first call.' },
      { q: 'How long does it take to start?', a: 'Usually a few weeks, depending on your catalogue and billing software. We give you a date in the written scope.' },
    ],
  },
  {
    slug: 'freight-billing-software',
    h1: 'LR and freight billing software for transporters',
    answer: 'Freight billing software links every lorry receipt to its freight bill and every payment to the bills it settles, so a transporter always knows what is billed, paid and pending.',
    sections: [
      {
        h2: 'Where transport billing goes wrong',
        body: [
          'In most transport offices the lorry receipt is written on paper or entered in an Excel sheet when the goods are booked. The freight bill is made later, often by someone else, by copying LR numbers, weights and rates across.',
          'That is where things slip. An LR is left off a bill, or billed twice. A rate is typed wrong. When the customer questions a bill, finding the original LR means going through files.',
          'Payments are harder still. Customers pay part of a bill, pay several bills in one transfer, or deduct TDS before paying. Matching each payment to the right bills by hand takes time, and your ledger drifts away from what the customer thinks they owe.',
          'Then a customer asks for their statement, and someone spends hours putting it together from the LR book, the bill file and the bank entries.',
        ],
      },
      {
        h2: 'What the system does',
        body: [
          '<ul><li>The LR is entered once, when the goods are booked: consignor, consignee, route, weight, rate and charges.</li><li>Freight bills are made from the LRs, so each LR is billed once and every bill shows exactly which LRs it covers.</li><li>Each payment is allocated against one or more bills. Part payments, TDS and other deductions are recorded against the bill they belong to, so the pending amount is always right.</li><li>Customer statements come out on demand: every bill, every payment and the balance, for any period.</li><li>Customers can log in to a portal and see their own statement without calling your office.</li></ul>',
        ],
      },
      {
        h2: 'Built inside a working transport company',
        body: [
          'We did not design this from the outside. We built it first for Naveen Logistics, a family-run transport business in Bengaluru, and it runs their operations daily.',
          'That is why it handles the untidy cases, like a customer who pays three bills with one transfer and deducts TDS on all of them. The system was shaped by what happens in a real transport office, not by a feature list.',
        ],
      },
      {
        h2: 'Getting it for your business',
        body: [
          'Every transport business bills a little differently. Rates may be per kg, per trip or per article. Some customers get one bill a month, others one bill per LR. Your bill carries your own layout.',
          'We set the system up for your routes, rates and bill format, and show your office staff how to use it. Talk to us and tell us how billing works today. If you need more than billing, we can build that as <a class="link" href="/custom-software">custom software</a>.',
        ],
      },
    ],
    leadsTo: { label: 'See the freight billing system', href: '/products/freight-billing' },
    faqs: [
      { q: 'Can it handle part payments and TDS?', a: 'Yes. Payments are allocated against one or more bills, including part payments and deductions.' },
      { q: 'Can customers see their own statement?', a: 'Yes. Each customer gets a login to see their bills, payments and balance.' },
      { q: 'Do we need to change our bill format?', a: 'No. We set it up to match the format you already send.' },
    ],
  },
  {
    slug: 'distributor-software',
    h1: 'Custom software for distributors and wholesalers',
    answer: "When off-the-shelf software doesn't fit how a distribution business works, a custom system can handle ordering, billing and stock your way and still keep Tally, Busy or Marg as the books.",
    sections: [
      {
        h2: "Signs you've outgrown spreadsheets",
        body: [
          'Most distribution businesses start with Excel and Tally, and for a while that works. These are the signs it has stopped working:',
          '<ul><li>The same data is typed in two places: an order in a register or sheet, then again as a bill.</li><li>Stock in the system never matches stock in the godown, so someone checks the shelf before confirming an order.</li><li>A report the owner asks for, like dues by salesman or sales by area, takes a day to put together.</li><li>One person knows how all the sheets connect, and work slows down when they are on leave.</li></ul>',
          'Working harder does not fix any of these. Having one system where each thing is entered once does.',
        ],
      },
      {
        h2: 'What we build for distributors',
        body: [
          'We build around how your business already runs, not around a generic list of modules. Depending on what you need, that can include:',
          '<ul><li>Order capture from salesmen, retailers and your counter, in one place.</li><li>Billing rules for your schemes, rate slabs, credit limits and discounts.</li><li>Stock across godowns, with transfers between them.</li><li>Salesman and route tracking: which shops were visited and what was booked.</li><li>A retailer portal where shops place orders and check what they owe.</li><li>Dashboards for the owner with sales, dues and stock on one screen.</li></ul>',
          'If you are a pharma distributor and ordering is the main problem, read <a class="link" href="/solutions/pharma-distributor-ordering">online ordering for pharma distributors</a> first. A product we already run may cover it.',
        ],
      },
      {
        h2: 'Keeping Tally, Busy or Marg',
        body: [
          'Most distributors do not want to change their accounting software, and neither does their accountant. We do not ask you to.',
          'We connect the new system to Tally, Busy or Marg, so bills, receipts and stock movements reach the books you already keep. Your accountant keeps working the way they do now, and the new system handles the parts those packages were never built for.',
        ],
      },
      {
        h2: 'How a build goes',
        body: [
          'Every build follows the same four steps:',
          stepsHtml,
        ],
      },
    ],
    leadsTo: { label: 'How custom builds work', href: '/custom-software' },
    faqs: [
      { q: 'Will we have to stop using Tally?', a: 'No. We connect to it so your books stay where they are.' },
      { q: 'Who owns the software?', a: 'Your data is always yours. Ownership of the code is agreed in the written scope before work starts.' },
      { q: 'What does it cost?', a: 'It depends on scope. After the first call you get a fixed written price before anything starts.' },
    ],
  },
];
