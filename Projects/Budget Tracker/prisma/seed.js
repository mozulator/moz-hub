// Prisma client is generated into a project-local folder so multiple Prisma apps can coexist.
// eslint-disable-next-line import/no-dynamic-require, global-require
const { PrismaClient } = require('../generated/prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminUsername = String(process.env.BUDGET_TRACKER_ADMIN_USERNAME || '').trim();
  const adminPassword = String(process.env.BUDGET_TRACKER_ADMIN_PASSWORD || '');

  if (!adminUsername || !adminPassword) {
    throw new Error(
      'Missing required env vars for seed: BUDGET_TRACKER_ADMIN_USERNAME and BUDGET_TRACKER_ADMIN_PASSWORD'
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  const user = await prisma.user.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
    create: {
      username: adminUsername,
      passwordHash,
    },
  });
  
  console.log(`✅ Created/updated admin user: ${user.username}`);

  // Create default payment types
  const paymentTypes = [
    { name: 'Subscriptions', icon: 'tv', color: 'rose', description: 'Digital services & subscriptions' },
    { name: 'Food & Groceries', icon: 'shopping-cart', color: 'emerald', description: 'Supermarkets and food delivery' },
    { name: 'Transportation', icon: 'car', color: 'sky', description: 'Taxi, fuel, public transit' },
    { name: 'Utilities', icon: 'zap', color: 'amber', description: 'Electricity, water, internet, phone' },
    { name: 'Entertainment', icon: 'gamepad-2', color: 'violet', description: 'Games, streaming donations' },
    { name: 'Healthcare', icon: 'heart-pulse', color: 'red', description: 'Pharmacy, doctors' },
    { name: 'Shopping', icon: 'shopping-bag', color: 'fuchsia', description: 'Electronics, retail, pet supplies' },
    { name: 'Transfers', icon: 'arrow-right-left', color: 'slate', description: 'Personal transfers, ATM' },
    { name: 'Online Services', icon: 'globe', color: 'cyan', description: 'PayPal, online payments' },
    { name: 'Insurance', icon: 'shield', color: 'orange', description: 'Insurance payments' },
    { name: 'Bank Fees', icon: 'landmark', color: 'gray', description: 'Bank charges and fees' },
    { name: 'Loans', icon: 'building-2', color: 'stone', description: 'Loan payments and mortgages' },
  ];

  for (const type of paymentTypes) {
    await prisma.paymentType.upsert({
      where: { name: type.name },
      update: type,
      create: type,
    });
  }
  
  console.log(`✅ Created/updated ${paymentTypes.length} payment types`);

  // Create default extraction prompt
  const defaultPrompt = `You are an expert financial document analyzer specializing in extracting payment transactions from bank statements and financial PDFs.

## Your Task

Analyze the provided PDF document and extract ALL payment transactions. For each payment, identify and extract:

1. **Date** - The transaction date in \`YYYY-MM-DD\` format
2. **Recipient** - Who received the payment (merchant name, service provider, individual, etc.)
3. **Amount** - The payment amount as a number (no currency symbols)
4. **Category** - Assign the most appropriate category from the list below

## Available Categories

{{CATEGORIES}}

## Category Assignment Rules

- **Subscriptions**: Digital services like Netflix, Spotify, ChatGPT, Cursor, YouTube Premium, Google One, hosting services, software subscriptions
- **Food & Groceries**: Supermarkets (Maxi, Lidl, Idea), food delivery (Wolt, Glovo), restaurants, cafes
- **Transportation**: Taxi (Yandex, CarGo), fuel, public transit, parking
- **Utilities**: Electricity (EPS), water, phone bills (Yettel, MTS, A1), internet, housing fees (Infostan, Stambena zajednica)
- **Entertainment**: Gaming (Steam, PlayStation, Xbox), streaming donations, Twitch, gaming purchases
- **Healthcare**: Pharmacies (Benu, Dr Max), doctors, medical services
- **Shopping**: Electronics, retail stores, pet supplies, general shopping
- **Transfers**: Personal transfers to individuals, ATM withdrawals
- **Online Services**: PayPal transfers, online payments not fitting other categories
- **Insurance**: Insurance companies (Dunav, Generali, DDOR)
- **Bank Fees**: Bank charges, account fees, transaction fees
- **Loans**: Loan payments, mortgage payments, credit installments (KREDITNA PARTIJA, TRAJNI NALOG for loans)

## Output Format

Return ONLY a valid JSON object with the following structure:

\`\`\`json
{
  "payments": [
    {
      "date": "YYYY-MM-DD",
      "recipient": "Clean merchant/recipient name",
      "amount": 1234.56,
      "category": "Category Name"
    }
  ],
  "metadata": {
    "documentType": "Bank Statement",
    "accountHolder": "Name if visible",
    "statementPeriod": "Date range of the statement",
    "currency": "RSD",
    "totalTransactions": 0
  }
}
\`\`\`

## Extraction Rules

1. **Dates**: Convert all dates to ISO format \`YYYY-MM-DD\`. If year is not specified, infer from document context.

2. **Recipients**: 
   - Clean up merchant names (remove transaction codes, reference numbers)
   - Preserve meaningful identifiers (store locations, service types)
   - Keep recognizable brand names (MAXI, WOLT, YANDEX GO, etc.)

3. **Amounts**:
   - Extract as positive numbers
   - Only include OUTGOING payments (debits/expenses)
   - Ignore incoming payments (credits/deposits)
   - Remove currency symbols and thousand separators
   - Use dot (.) as decimal separator

4. **Categories**:
   - Assign the BEST matching category from the list above
   - Use exact category names as provided
   - When uncertain, use the most logical category based on merchant name

## CRITICAL: Transactions to EXCLUDE (These are INCOMING money, not expenses!)

- **VIDEOBOLT** - This is a salary/paycheck payment, NOT an expense
- Any transaction marked as "UPLATA" (deposit) that appears to be incoming
- Interest payments received
- Refunds

## CRITICAL: Do NOT Miss These Payment Types

**Standing Orders / Recurring Payments (Serbian: TRAJNI NALOG)**:
- Look for: "TRAJNI NALOG", "IZVRŠENJE TRAJNOG NALOGA", "STANDING ORDER"
- If it's for a loan/credit → Category: "Loans"
- If it's for utilities → Category: "Utilities"

**Loan/Credit Payments (Serbian: KREDIT, KREDITNA PARTIJA)**:
- Look for: "KREDITNA PARTIJA", "UPLATA NA AVANS", "RATA KREDITA", "KREDIT", "LOAN"
- These go to Category: "Loans"

**Common Serbian Merchants**:
- MAXI, LIDL, IDEA → "Food & Groceries"
- WOLT DOO → "Food & Groceries"
- YANDEX GO → "Transportation"
- EPS AD BEOGRAD → "Utilities"
- JKP INFOSTAN → "Utilities"
- YETTEL → "Utilities"
- STAMBENA ZAJEDNICA → "Utilities"

## Important

- Return ONLY the JSON object, no additional text or explanation
- Ensure the JSON is valid and parseable
- If a field cannot be determined, use null
- Be thorough - missing transactions is worse than including uncertain ones
- ALWAYS assign a category - never leave it empty`;

  await prisma.setting.upsert({
    where: { key: 'extraction_prompt' },
    update: {}, // Don't update if exists (preserve user changes)
    create: {
      key: 'extraction_prompt',
      value: defaultPrompt,
    },
  });
  
  console.log('✅ Created default extraction prompt');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

