export type OnboardingSport = 'badminton' | 'pickleball' | 'tennis';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

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