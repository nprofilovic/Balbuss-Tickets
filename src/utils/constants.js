// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.balbuss.rs',
  ENDPOINTS: {
    AUTH: '/auth',
    BUSES: '/buses',
    ROUTES: '/routes',
    BOOKINGS: '/bookings',
    USERS: '/users',
    CITIES: '/cities',
    PAYMENTS: '/payments'
  },
  TIMEOUT: 10000
};

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
  PHONE_REGEX: /^(\+381|0)[0-9]{8,9}$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSENGERS: 9
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Greška u mreži. Proverite internet konekciju.',
  INVALID_EMAIL: 'Unesite validnu email adresu.',
  INVALID_PHONE: 'Unesite validan broj telefona.',
  PASSWORD_TOO_SHORT: `Lozinka mora imati najmanje ${VALIDATION.MIN_PASSWORD_LENGTH} karaktera.`,
  REQUIRED_FIELD: 'Ovo polje je obavezno.',
  BOOKING_FAILED: 'Rezervacija nije uspešna. Pokušajte ponovo.',
  PAYMENT_FAILED: 'Plaćanje nije uspešno. Pokušajte ponovo.'
};