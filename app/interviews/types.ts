// Player data types for interview page

export interface PlayerBasicInfo {
  name: string;
  nameEn: string;
  team: string;
  position: string[];
  height: number;
  weight: number;
  birthDate: string;
  nationality: string;
}

export interface CareerItem {
  period: string;
  team: string;
}

export interface PlayerStrength {
  name: string;
  nameEn: string;
  description: string;
}

export interface PlayerStats {
  [key: string]: number;
}

export interface Player {
  id: string;
  basicInfo: PlayerBasicInfo;
  career: CareerItem[];
  strengths: PlayerStrength[];
  stats: PlayerStats;
  interview: string;
  profileImage?: string;
}

export type PlayerId = 'kim-geono' | 'choi-eunwoo';
