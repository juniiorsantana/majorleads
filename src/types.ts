export interface Lead {
  id: string;
  name: string;
  email: string;
  location: string;
  segment: 'Quente' | 'Morno' | 'Frio' | 'Em saída';
  source: 'Facebook' | 'Google' | 'Instagram' | 'Direct' | 'Email Mkt';
  avatar?: string;
  lastSeen: string;
}

export interface Popup {
  id: string;
  name: string;
  trigger: string;
  views: number;
  ctr: number;
  conversion: number;
  status: 'Active' | 'Paused' | 'Draft';
  thumbnail: string;
  platform: 'Desktop' | 'Mobile' | 'All';
}

export interface ChartData {
  name: string;
  visitors: number;
  leads: number;
}
