// Data store for Budget Tracker
// Real data extracted from bank statements

const paymentTypes = [
  { id: '1', name: 'Subscriptions', icon: 'tv', color: 'rose', description: 'Digital services & subscriptions' },
  { id: '2', name: 'Food & Groceries', icon: 'shopping-cart', color: 'emerald', description: 'Supermarkets and food delivery' },
  { id: '3', name: 'Transportation', icon: 'car', color: 'sky', description: 'Taxi, fuel, public transit' },
  { id: '4', name: 'Utilities', icon: 'zap', color: 'amber', description: 'Electricity, water, internet, phone' },
  { id: '5', name: 'Entertainment', icon: 'gamepad-2', color: 'violet', description: 'Games, streaming donations' },
  { id: '6', name: 'Healthcare', icon: 'heart-pulse', color: 'red', description: 'Pharmacy, doctors' },
  { id: '7', name: 'Shopping', icon: 'shopping-bag', color: 'fuchsia', description: 'Electronics, retail, pet supplies' },
  { id: '8', name: 'Transfers', icon: 'arrow-right-left', color: 'slate', description: 'Personal transfers, ATM' },
  { id: '9', name: 'Online Services', icon: 'globe', color: 'cyan', description: 'PayPal, online payments' },
  { id: '10', name: 'Insurance', icon: 'shield', color: 'orange', description: 'Insurance payments' },
  { id: '11', name: 'Bank Fees', icon: 'landmark', color: 'gray', description: 'Bank charges and fees' },
];

const services = [
  { id: '1', paymentTypeId: '1', name: 'ChatGPT Plus', unsubscribeUrl: 'https://chat.openai.com/settings/subscription' },
  { id: '2', paymentTypeId: '1', name: 'Cursor Pro', unsubscribeUrl: 'https://cursor.com/settings' },
  { id: '3', paymentTypeId: '1', name: 'Google One', unsubscribeUrl: 'https://one.google.com/settings' },
  { id: '4', paymentTypeId: '1', name: 'YouTube Premium', unsubscribeUrl: 'https://www.youtube.com/paid_memberships' },
  { id: '5', paymentTypeId: '1', name: 'Twitch Subscriptions', unsubscribeUrl: 'https://www.twitch.tv/subscriptions' },
  { id: '6', paymentTypeId: '1', name: 'Hostinger', unsubscribeUrl: 'https://www.hostinger.com/cpanel' },
  { id: '7', paymentTypeId: '1', name: 'ElevenLabs', unsubscribeUrl: 'https://elevenlabs.io/subscription' },
  { id: '8', paymentTypeId: '1', name: 'Render.com', unsubscribeUrl: 'https://dashboard.render.com/billing' },
  { id: '9', paymentTypeId: '1', name: 'Kaspersky', unsubscribeUrl: 'https://my.kaspersky.com/subscriptions' },
  { id: '10', paymentTypeId: '4', name: 'Yettel', unsubscribeUrl: null },
  { id: '11', paymentTypeId: '4', name: 'EPS (Electricity)', unsubscribeUrl: null },
  { id: '12', paymentTypeId: '4', name: 'Infostan', unsubscribeUrl: null },
];

const payments = [
  // November 2025 - Extracted from bank statement
  { id: '1', date: '2025-11-01', recipient: 'ALTA GROUP', amount: 11200, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '2', date: '2025-11-01', recipient: 'PAYPAL *TANGIA', amount: 2691.59, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '3', date: '2025-11-01', recipient: 'PAYPAL *TANGIA', amount: 1080.48, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '4', date: '2025-11-01', recipient: 'PAYPAL *TANGIA', amount: 10802.39, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '5', date: '2025-11-01', recipient: 'PAYPAL *TANGIA', amount: 537.84, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '6', date: '2025-11-01', recipient: 'PAYPAL *TANGIA', amount: 2689.19, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '7', date: '2025-11-01', recipient: 'PAYPAL *TANGIA', amount: 2689.19, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '8', date: '2025-11-01', recipient: 'PAYPAL *RENEEBRUNET', amount: 31757.67, paymentTypeId: '9', serviceId: null, monthKey: '2025-11' },
  { id: '9', date: '2025-11-01', recipient: 'KASPERSKY NEXWAY', amount: 4309.91, paymentTypeId: '1', serviceId: '9', monthKey: '2025-11' },
  { id: '10', date: '2025-11-02', recipient: 'TEHNOMEDIA CENTAR MP 3', amount: 69999, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '11', date: '2025-11-02', recipient: 'PAYPAL *TANGIA', amount: 540.24, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '12', date: '2025-11-02', recipient: 'PAYPAL *TANGIA', amount: 2700, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '13', date: '2025-11-02', recipient: 'PAYPAL *TANGIA', amount: 540.24, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '14', date: '2025-11-03', recipient: 'GOOGLE *ADS8266991029', amount: 5096.26, paymentTypeId: '1', serviceId: null, monthKey: '2025-11' },
  { id: '15', date: '2025-11-04', recipient: 'DM FILIJALA NOVI BEOGRAD', amount: 1817, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '16', date: '2025-11-04', recipient: 'MAXI 767', amount: 2452.9, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '17', date: '2025-11-04', recipient: 'MAXI 767', amount: 1208.8, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '18', date: '2025-11-04', recipient: 'PAYPAL *TANGIA', amount: 2707.01, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '19', date: '2025-11-04', recipient: 'STAMBENA ZAJEDNICA', amount: 5807.16, paymentTypeId: '4', serviceId: null, monthKey: '2025-11' },
  { id: '20', date: '2025-11-05', recipient: 'MAXI 767', amount: 5555.83, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '21', date: '2025-11-05', recipient: 'PREMIUM PET WEST 65', amount: 2592, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '22', date: '2025-11-05', recipient: 'PAYPAL *TANGIA', amount: 2714.29, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '23', date: '2025-11-05', recipient: 'OPENAI *CHATGPT SUBSCR', amount: 2126.05, paymentTypeId: '1', serviceId: '1', monthKey: '2025-11' },
  { id: '24', date: '2025-11-05', recipient: 'OPENAI', amount: 531.81, paymentTypeId: '1', serviceId: '1', monthKey: '2025-11' },
  { id: '25', date: '2025-11-05', recipient: 'RENDER.COM', amount: 6207.68, paymentTypeId: '1', serviceId: '8', monthKey: '2025-11' },
  { id: '26', date: '2025-11-06', recipient: 'MAXI 767', amount: 1841.49, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '27', date: '2025-11-06', recipient: 'GOOGLE *GOOGLE ONE', amount: 2721.47, paymentTypeId: '1', serviceId: '3', monthKey: '2025-11' },
  { id: '28', date: '2025-11-06', recipient: 'GOOGLE *YOUTUBEPREMIUM', amount: 858.34, paymentTypeId: '1', serviceId: '4', monthKey: '2025-11' },
  { id: '29', date: '2025-11-06', recipient: 'PAYPAL *TANGIA', amount: 1087.63, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '30', date: '2025-11-07', recipient: 'PAYPAL *TANGIA', amount: 2717.77, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '31', date: '2025-11-08', recipient: 'MAXI 767', amount: 1572.02, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '32', date: '2025-11-08', recipient: 'PAYPAL *TANGIA', amount: 1089.88, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '33', date: '2025-11-08', recipient: 'XSOLLA *TWITCH', amount: 5876.71, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '34', date: '2025-11-08', recipient: 'HOSTINGER', amount: 1061.07, paymentTypeId: '1', serviceId: '6', monthKey: '2025-11' },
  { id: '35', date: '2025-11-09', recipient: 'PAYPAL *TANGIA', amount: 1089.88, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '36', date: '2025-11-10', recipient: 'ELEVENLABS.IO', amount: 1167.9, paymentTypeId: '1', serviceId: '7', monthKey: '2025-11' },
  { id: '37', date: '2025-11-12', recipient: 'WOLT DOO', amount: 5138, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '38', date: '2025-11-12', recipient: 'MAXI 767', amount: 3353.43, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '39', date: '2025-11-12', recipient: 'WOLT DOO', amount: 1642.6, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '40', date: '2025-11-12', recipient: 'YETTEL ERACUN APP', amount: 3708.6, paymentTypeId: '4', serviceId: '10', monthKey: '2025-11' },
  { id: '41', date: '2025-11-12', recipient: 'MAXI 767', amount: 2442.35, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '42', date: '2025-11-12', recipient: 'GOOGLE *YOUTUBE MEMBER', amount: 208.81, paymentTypeId: '1', serviceId: '4', monthKey: '2025-11' },
  { id: '43', date: '2025-11-12', recipient: 'XSOLLA *TWITCHBITS', amount: 8691.82, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '44', date: '2025-11-12', recipient: 'KLINGAI.COM', amount: 530.41, paymentTypeId: '1', serviceId: null, monthKey: '2025-11' },
  { id: '45', date: '2025-11-12', recipient: 'STAMBENA ZAJEDNICA', amount: 5807.16, paymentTypeId: '4', serviceId: null, monthKey: '2025-11' },
  { id: '46', date: '2025-11-13', recipient: 'YANDEX GO', amount: 787, paymentTypeId: '3', serviceId: null, monthKey: '2025-11' },
  { id: '47', date: '2025-11-13', recipient: 'YANDEX GO', amount: 788, paymentTypeId: '3', serviceId: null, monthKey: '2025-11' },
  { id: '48', date: '2025-11-13', recipient: 'PAYPAL *TANGIA', amount: 541.21, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '49', date: '2025-11-14', recipient: 'MP428 FOB', amount: 4100, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '50', date: '2025-11-14', recipient: 'MP428 FOB', amount: 5092.45, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '51', date: '2025-11-14', recipient: 'WOLT DOO', amount: 2045.4, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '52', date: '2025-11-14', recipient: 'MAXI 767', amount: 890.94, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '53', date: '2025-11-14', recipient: 'XSOLLA *TWITCHBITS', amount: 189.59, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '54', date: '2025-11-14', recipient: 'EPS AD BEOGRAD', amount: 6211.32, paymentTypeId: '4', serviceId: '11', monthKey: '2025-11' },
  { id: '55', date: '2025-11-14', recipient: 'JKP INFOSTAN TEHNOLOGIJE', amount: 3220.97, paymentTypeId: '4', serviceId: '12', monthKey: '2025-11' },
  { id: '56', date: '2025-11-15', recipient: 'JKP INFOSTAN TEHNOLOGIJE', amount: 540.58, paymentTypeId: '4', serviceId: '12', monthKey: '2025-11' },
  { id: '57', date: '2025-11-15', recipient: 'DM FILIJALA NOVI BEOGRAD', amount: 3397, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '58', date: '2025-11-15', recipient: 'PRODAVNICA 22', amount: 3757, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '59', date: '2025-11-15', recipient: 'JKP INFOSTAN TEHNOLOGIJE', amount: 625.96, paymentTypeId: '4', serviceId: '12', monthKey: '2025-11' },
  { id: '60', date: '2025-11-15', recipient: 'JKP INFOSTAN TEHNOLOGIJE', amount: 3298.28, paymentTypeId: '4', serviceId: '12', monthKey: '2025-11' },
  { id: '61', date: '2025-11-15', recipient: 'DUNAV OSIGURANJE A.D.O', amount: 5784.56, paymentTypeId: '10', serviceId: null, monthKey: '2025-11' },
  { id: '62', date: '2025-11-16', recipient: 'YANDEX GO', amount: 664, paymentTypeId: '3', serviceId: null, monthKey: '2025-11' },
  { id: '63', date: '2025-11-16', recipient: 'BENU PHARMACIES 449', amount: 338.98, paymentTypeId: '6', serviceId: null, monthKey: '2025-11' },
  { id: '64', date: '2025-11-16', recipient: 'CURSOR.COM', amount: 10635.81, paymentTypeId: '1', serviceId: '2', monthKey: '2025-11' },
  { id: '65', date: '2025-11-17', recipient: 'STEAM PURCHASE', amount: 5999.44, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '66', date: '2025-11-17', recipient: 'STEAM PURCHASE', amount: 599.94, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '67', date: '2025-11-17', recipient: 'PAYPAL *TANGIA', amount: 538.75, paymentTypeId: '5', serviceId: null, monthKey: '2025-11' },
  { id: '68', date: '2025-11-18', recipient: 'WOLT DOO', amount: 1789, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '69', date: '2025-11-18', recipient: 'PREMIUM PET WEST 65', amount: 3654, paymentTypeId: '7', serviceId: null, monthKey: '2025-11' },
  { id: '70', date: '2025-11-18', recipient: 'MAXI 774', amount: 452.46, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '71', date: '2025-11-18', recipient: 'TWITCH.TV', amount: 1053.5, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '72', date: '2025-11-19', recipient: 'WOLT DOO', amount: 1844, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '73', date: '2025-11-19', recipient: 'HANGAR FOOD MARKET', amount: 4800, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '74', date: '2025-11-19', recipient: 'TAJKO', amount: 100000, paymentTypeId: '8', serviceId: null, monthKey: '2025-11' },
  { id: '75', date: '2025-11-19', recipient: 'MOMCILO STOJKOVIC', amount: 20000, paymentTypeId: '8', serviceId: null, monthKey: '2025-11' },
  { id: '76', date: '2025-11-21', recipient: 'MAXI 767', amount: 1467.95, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '77', date: '2025-11-21', recipient: 'MAXI 767', amount: 3733.35, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '78', date: '2025-11-21', recipient: 'TWITCH.TV', amount: 210.13, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '79', date: '2025-11-21', recipient: 'TWITCH.TV', amount: 42130.29, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '104', date: '2025-11-21', recipient: 'KREDITNA PARTIJA - TRAJNI NALOG', amount: 153357.52, paymentTypeId: '4', serviceId: null, monthKey: '2025-11' },
  { id: '80', date: '2025-11-21', recipient: 'TWITCH.TV', amount: 2106.09, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '81', date: '2025-11-21', recipient: 'TWITCH.TV', amount: 210.13, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '82', date: '2025-11-22', recipient: 'TWITCH.TV', amount: 1063.99, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '83', date: '2025-11-23', recipient: 'WOLT DOO', amount: 834.7, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '84', date: '2025-11-24', recipient: 'TWITCH.TV', amount: 21217.34, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '85', date: '2025-11-25', recipient: 'MAXI 767', amount: 3024.45, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '86', date: '2025-11-25', recipient: 'MAXI 767', amount: 964.72, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '87', date: '2025-11-26', recipient: 'WOLT DOO', amount: 993.7, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '88', date: '2025-11-26', recipient: 'MAXI 767', amount: 4143.89, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '89', date: '2025-11-27', recipient: 'WOLT DOO', amount: 946, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '90', date: '2025-11-27', recipient: 'MAXI 767', amount: 690.95, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '91', date: '2025-11-28', recipient: 'ATM BEOGRAD', amount: 150, paymentTypeId: '8', serviceId: null, monthKey: '2025-11' },
  { id: '92', date: '2025-11-28', recipient: 'ATM BEOGRAD', amount: 5000, paymentTypeId: '8', serviceId: null, monthKey: '2025-11' },
  { id: '93', date: '2025-11-29', recipient: 'YANDEX GO', amount: 773, paymentTypeId: '3', serviceId: null, monthKey: '2025-11' },
  { id: '94', date: '2025-11-29', recipient: 'YANDEX GO', amount: 725, paymentTypeId: '3', serviceId: null, monthKey: '2025-11' },
  { id: '95', date: '2025-11-29', recipient: 'WOLT DOO', amount: 776.4, paymentTypeId: '2', serviceId: null, monthKey: '2025-11' },
  { id: '96', date: '2025-11-29', recipient: 'TWITCH.TV', amount: 13698.54, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '97', date: '2025-11-29', recipient: 'TWITCH.TV', amount: 210.36, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '98', date: '2025-11-29', recipient: 'CURSOR.COM', amount: 2119.21, paymentTypeId: '1', serviceId: '2', monthKey: '2025-11' },
  { id: '99', date: '2025-11-29', recipient: 'TWITCH.TV', amount: 6831.24, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '100', date: '2025-11-29', recipient: 'TWITCH.TV', amount: 210.36, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '101', date: '2025-11-30', recipient: 'TWITCH.TV', amount: 210.36, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '102', date: '2025-11-30', recipient: 'TWITCH.TV', amount: 210.36, paymentTypeId: '5', serviceId: '5', monthKey: '2025-11' },
  { id: '103', date: '2025-11-30', recipient: 'NAKNADA ZA TR', amount: 410, paymentTypeId: '11', serviceId: null, monthKey: '2025-11' },
];

const availableMonths = [
  { value: '2025-11', label: 'November 2025' },
];

// Helper functions
function getMonthlyOverview(month) {
  const monthPayments = payments.filter(p => p.monthKey === month);
  const totalSpent = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const typeStats = {};
  monthPayments.forEach(p => {
    if (!typeStats[p.paymentTypeId]) {
      typeStats[p.paymentTypeId] = { total: 0, count: 0 };
    }
    typeStats[p.paymentTypeId].total += p.amount;
    typeStats[p.paymentTypeId].count += 1;
  });
  
  const enrichedTypes = paymentTypes
    .filter(pt => typeStats[pt.id])
    .map(pt => ({
      ...pt,
      monthlyTotal: typeStats[pt.id].total,
      paymentCount: typeStats[pt.id].count,
      percentage: Math.round((typeStats[pt.id].total / totalSpent) * 100)
    }))
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);
  
  return {
    paymentTypes: enrichedTypes,
    totalSpent
  };
}

function getPayments(month, search = '') {
  let filtered = payments.filter(p => p.monthKey === month);
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(p => 
      p.recipient.toLowerCase().includes(searchLower)
    );
  }
  return filtered.map(p => ({
    ...p,
    paymentType: paymentTypes.find(pt => pt.id === p.paymentTypeId) || null
  })).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getAllPaymentTypes() {
  return paymentTypes.map(pt => ({
    ...pt,
    paymentCount: payments.filter(p => p.paymentTypeId === pt.id).length,
    totalAmount: payments.filter(p => p.paymentTypeId === pt.id).reduce((sum, p) => sum + p.amount, 0)
  }));
}

function getPaymentType(id) {
  return paymentTypes.find(pt => pt.id === id) || null;
}

function getPaymentsByType(typeId, month = null) {
  let filtered = payments.filter(p => p.paymentTypeId === typeId);
  if (month) {
    filtered = filtered.filter(p => p.monthKey === month);
  }
  return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getServicesByType(typeId) {
  return services.filter(s => s.paymentTypeId === typeId);
}

function getPaymentTypeStats(typeId) {
  const typePayments = payments.filter(p => p.paymentTypeId === typeId);
  return {
    totalAmount: typePayments.reduce((sum, p) => sum + p.amount, 0),
    paymentCount: typePayments.length,
    averageAmount: typePayments.length > 0 
      ? typePayments.reduce((sum, p) => sum + p.amount, 0) / typePayments.length 
      : 0
  };
}

function getAvailableMonths() {
  return availableMonths;
}

module.exports = {
  getMonthlyOverview,
  getPayments,
  getAllPaymentTypes,
  getPaymentType,
  getPaymentsByType,
  getServicesByType,
  getPaymentTypeStats,
  getAvailableMonths
};

