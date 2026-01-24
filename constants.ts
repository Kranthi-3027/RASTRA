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
  address: 'Jubilee Hills, Hyderabad'
};

export const MOCK_ADMIN: User = {
  id: 'a1',
  name: 'Municipal Admin',
  email: 'admin@hyd-municipal.gov.in',
  role: UserRole.ADMIN,
  avatarUrl: 'https://picsum.photos/101/101',
  phoneNumber: '+91 40 2322 2111',
  address: 'GHMC Head Office'
};

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'TKN-8821',
    userId: 'u2',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    latitude: 17.3850,
    longitude: 78.4867,
    status: ComplaintStatus.AUTO_VERIFIED,
    severity: Severity.HIGH,
    description: 'Deep pothole near Charminar main road.',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    address: 'Charminar Rd, Hyderabad'
  },
  {
    id: 'TKN-8822',
    userId: 'u3',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    latitude: 17.4401,
    longitude: 78.3489,
    status: ComplaintStatus.WAITING_LIST,
    severity: Severity.MEDIUM,
    description: 'Uneven road surface causing slow traffic.',
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    address: 'Gachibowli, Hyderabad'
  },
  {
    id: 'TKN-8823',
    userId: 'u1',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    latitude: 17.4114,
    longitude: 78.5322,
    status: ComplaintStatus.REPAIRED,
    severity: Severity.LOW,
    description: 'Minor crack on pavement.',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    address: 'Tarnaka, Secunderabad'
  }
];