import { Complaint, ComplaintStatus, Severity, User, UserRole } from './types';

export const APP_NAME = 'RASHTRA';

export const COLORS = {
  primary: '#0A3D62',
  secondary: '#1DD1A1',
  alert: '#EE5253',
  warning: '#FBC531',
  white: '#FFFFFF',
  dark: '#121212'
};

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Rohan Sharma',
  email: 'rohan@example.com',
  role: UserRole.USER,
  avatarUrl: 'https://picsum.photos/100/100',
  phoneNumber: '+91 98765 43210',
  address: 'Juna Plot, Solapur'
};

export const MOCK_ADMIN: User = {
  id: 'a1',
  name: 'Municipal Admin',
  email: 'admin@solapur-municipal.gov.in',
  role: UserRole.ADMIN,
  avatarUrl: 'https://picsum.photos/101/101',
  phoneNumber: '+91 217 274 0300',
  address: 'SMC Head Office, Solapur'
};

// Start with mock data for production-like behavior
export const INITIAL_COMPLAINTS: Complaint[] = [
  // --- 5 VERIFIED COMPLAINTS ---
  {
    id: 'TKN-1001',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6599,
    longitude: 75.9064,
    status: ComplaintStatus.AUTO_VERIFIED,
    severity: Severity.HIGH,
    severityScore: 8.5,
    description: 'Large pothole causing traffic slowdown near Siddheshwar Temple.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    address: 'Siddheshwar Peth, Solapur',
    departments: ['Engineering'],
    comments: [],
    concernCount: 12,
    hasRaisedConcern: false,
    reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
  },
  {
    id: 'TKN-1002',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1584463673574-0eb720fb37a9?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6620,
    longitude: 75.9100,
    status: ComplaintStatus.AUTO_VERIFIED,
    severity: Severity.MEDIUM,
    severityScore: 6.2,
    description: 'Cracked pavement creating tripping hazard for pedestrians.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    address: 'Hotgi Road, Solapur',
    departments: ['Engineering'],
    comments: [],
    concernCount: 5,
    hasRaisedConcern: false,
    reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
  },
  {
    id: 'TKN-1003',
    userId: 'u1',
    imageUrl: 'https://plus.unsplash.com/premium_photo-1664303847960-586318f59035?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6550,
    longitude: 75.9020,
    status: ComplaintStatus.AUTO_VERIFIED,
    severity: Severity.HIGH,
    severityScore: 9.1,
    description: 'Severe waterlogging and road surface erosion.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    address: 'Saat Rasta, Solapur',
    departments: ['Ward'],
    comments: [],
    concernCount: 24,
    hasRaisedConcern: true,
    reportStats: { duplicate: 2, fake: 0, fixed: 0, wrongLocation: 0 }
  },
  {
    id: 'TKN-1004',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1626860350736-2633005828bc?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6700,
    longitude: 75.8900,
    status: ComplaintStatus.AUTO_VERIFIED,
    severity: Severity.LOW,
    severityScore: 3.5,
    description: 'Minor road chipping near school entrance.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    address: 'Ashok Chowk, Solapur',
    departments: ['Engineering'],
    comments: [],
    concernCount: 1,
    hasRaisedConcern: false,
    reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
  },
  {
    id: 'TKN-1005',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1599933597341-a3d2c3df4286?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6480,
    longitude: 75.9150,
    status: ComplaintStatus.AUTO_VERIFIED,
    severity: Severity.MEDIUM,
    severityScore: 5.8,
    description: 'Manhole cover damaged and slightly open.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    address: 'Akkalkot Road, Solapur',
    departments: ['Ward'],
    comments: [],
    concernCount: 8,
    hasRaisedConcern: false,
    reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
  },

  // --- 4 WAITING LIST COMPLAINTS ---
  {
    id: 'TKN-2001',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1541447270888-83e8494f9c06?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6580,
    longitude: 75.9080,
    status: ComplaintStatus.WAITING_LIST,
    severity: Severity.LOW,
    severityScore: 2.0,
    description: 'Uneven surface, not sure if it needs repair.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    address: 'Navi Peth, Solapur',
    departments: ['Engineering'],
    comments: [],
    concernCount: 0,
    hasRaisedConcern: false,
    reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
  },
  {
    id: 'TKN-2002',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1610443907727-42289f02306f?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6520,
    longitude: 75.8950,
    status: ComplaintStatus.WAITING_LIST,
    severity: Severity.MEDIUM,
    severityScore: 4.5,
    description: 'Garbage accumulation on roadside.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    address: 'Market Yard, Solapur',
    departments: ['Ward'],
    comments: [],
    concernCount: 2,
    hasRaisedConcern: false,
    reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
  },
  {
    id: 'TKN-2003',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6650,
    longitude: 75.9200,
    status: ComplaintStatus.WAITING_LIST,
    severity: Severity.LOW,
    severityScore: 1.5,
    description: 'Street light flickering (Reported as road issue).',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    address: 'Kumthekar Nagar, Solapur',
    departments: ['Electricity'],
    comments: [],
    concernCount: 0,
    hasRaisedConcern: false,
    reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 1 }
  },
  {
    id: 'TKN-2004',
    userId: 'u1',
    imageUrl: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?auto=format&fit=crop&q=80&w=400',
    latitude: 17.6450,
    longitude: 75.9000,
    status: ComplaintStatus.WAITING_LIST,
    severity: Severity.HIGH,
    severityScore: 7.8,
    description: 'Tree branch fallen on road edge.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    address: 'Damani Nagar, Solapur',
    departments: ['Ward'],
    comments: [],
    concernCount: 3,
    hasRaisedConcern: false,
    reportStats: { duplicate: 0, fake: 0, fixed: 0, wrongLocation: 0 }
  }
];