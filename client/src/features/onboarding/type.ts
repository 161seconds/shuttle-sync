export type OnboardingSport = 'badminton' | 'pickleball';
export type SkillLevel = 'y' | 'y_minus' | 'y_plus' | 'tby_minus' | 'tby' | 'tby_plus' | 'tb_minus' | 'tb' | 'tb_plus' | 'tb_plus_2' | 'tb_plus_3' | 'tbk' | 'bc' | 'cn';

export interface UserPreferences {
    sports: OnboardingSport[];
    skillLevel: SkillLevel | null;
    location: string;
}

export interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}