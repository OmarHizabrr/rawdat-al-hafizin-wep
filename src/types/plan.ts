import { Timestamp } from "firebase/firestore";

export type PlanTargetType = 'hadiths' | 'pages' | 'volumes';

export interface PlanTierDefinition {
    id: string;
    label: string;
    color: string;
    targetType: PlanTargetType;
    icon?: string;
}

export interface PlanTemplate {
    id: string;
    name: string;
    description: string;
    category: 'memorization' | 'revision' | 'mixed';
    tiers: PlanTierDefinition[];
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface TierTask {
    tierId: string;
    label: string;
    type: PlanTargetType;
    start: string;
    end?: string;
    notes?: string[];
}

export interface PlanDay {
    id: string;
    weekIndex: number;
    dayIndex: number;
    tasks: TierTask[];
    updatedAt?: Timestamp;
}
