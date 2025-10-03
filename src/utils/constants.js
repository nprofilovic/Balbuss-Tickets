// utils/constants.js - AŽURIRANO

// ============================================
// API Configuration - KRITIČNO: Promenite ovo!
// ============================================

// VAŠA WORDPRESS INSTALACIJA URL
// Zamenite sa pravom WordPress URL adresom
export const WORDPRESS_URL = 'https://balbuss.rs'; // <- PROMENITE OVO!

export const API_CONFIG = {
  // WordPress REST API endpoint
  BASE_URL: `${WORDPRESS_URL}/wp-json`,
  
  ENDPOINTS: {
    // Balbuss custom endpoints
    BUSES: '/balbuss/v1/lines',
    SEARCH: '/balbuss/v1/lines/search',
    CITIES: '/balbuss/v1/cities',
    BOOKINGS: '/balbuss/v1/bookings',
    
    // WooCommerce endpoints (ako koristite WooCommerce REST API)
    WC_CART: '/wc/store/cart',
    WC_CHECKOUT: '/wc/store/checkout',
    WC_PRODUCTS: '/wc/v3/products',
    WC_ORDERS: '/wc/v3/orders'
  },
  
  TIMEOUT: 30000, // 30 sekundi za WooCommerce checkout
  
  // Headers za autentikaciju
  getHeaders: () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Ako imate API key, dodajte ovde:
    // 'Authorization': 'Bearer YOUR_API_KEY'
  })
};

// Za testiranje lokalnog development servera:
// export const WORDPRESS_URL = 'http://192.168.1.100'; // Vaša lokalna IP adresa

// App Configuration
export const APP_CONFIG = {
  NAME: 'BalBuss',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'office@balbuss.rs',
  SUPPORT_PHONE: '+381 62 977 9493'
};

// Serbian Cities (Popular destinations)
export const SERBIAN_CITIES = [
  { id: 1, name: 'Beograd', code: 'BG' },
  { id: 2, name: 'Novi Sad', code: 'NS' },
  { id: 3, name: 'Niš', code: 'NI' },
  { id: 4, name: 'Kragujevac', code: 'KG' },
  { id: 5, name: 'Subotica', code: 'SU' },
  { id: 6, name: 'Zrenjanin', code: 'ZR' },
  { id: 7, name: 'Pančevo', code: 'PA' },
  { id: 8, name: 'Čačak', code: 'CA' },
  { id: 9, name: 'Novi Pazar', code: 'NP' },
  { id: 10, name: 'Leskovac', code: 'LE' },
  { id: 11, name: 'Užice', code: 'UZ' },
  { id: 12, name: 'Valjevo', code: 'VA' },
  { id: 13, name: 'Jagodina', code: 'JA' },
  { id: 14, name: 'Kraljevo', code: 'KR' },
  { id: 15, name: 'Smederevo', code: 'SM' }
];

// Bus Amenities
export const BUS_AMENITIES = {
  WIFI: { id: 'wifi', name: 'WiFi', icon: 'wifi' },
  AC: { id: 'ac', name: 'Klima', icon: 'snow' },
  USB: { id: 'usb', name: 'USB punjač', icon: 'flash' },
  TOILET: { id: 'toilet', name: 'Toalet', icon: 'home' },
  SNACKS: { id: 'snacks', name: 'Užina', icon: 'cafe' },
  ENTERTAINMENT: { id: 'entertainment', name: 'Zabava', icon: 'tv' },
  RECLINING_SEATS: { id: 'reclining', name: 'Sedišta koja se spuštaju', icon: 'bed' },
  BLANKET: { id: 'blanket', name: 'Ćebe', icon: 'moon' }
};

// Payment Methods
export const PAYMENT_METHODS = {
  CARD: { id: 'card', name: 'Kreditna/Debitna kartica', icon: 'card' },
  PAYPAL: { id: 'paypal', name: 'PayPal', icon: 'logo-paypal' },
  CASH: { id: 'cash', name: 'Gotovina', icon: 'cash' }
};

// Ticket Status
export const TICKET_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

// Seat Types
export const SEAT_TYPES = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved'
};

// Screen Names (for navigation)
export const SCREENS = {
  HOME: 'Home',
  SEARCH_RESULTS: 'SearchResults',
  BUS_DETAILS: 'BusDetails',
  TICKET_DETAILS: 'TicketDetails',
  SEAT_SELECTION: 'SeatSelection',
  PASSENGER_INFO: 'PassengerInfo',
  PAYMENT: 'Payment',
  BOOKING_CONFIRMATION: 'BookingConfirmation',
  PROFILE: 'Profile',
  HISTORY: 'History',
  SETTINGS: 'Settings',
  LOGIN: 'Login',
  REGISTER: 'Register'
};

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD.MM.YYYY',
  API: 'YYYY-MM-DD',
  TIME: 'HH:mm',
  DATETIME: 'DD.MM.YYYY HH:mm'
};

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[0-9]{9,15}$/,
  MIN_PASSWORD_LENGTH: 6
};