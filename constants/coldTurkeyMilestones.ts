export type ColdTurkeyMilestone = {
    label: string;
    shortLabel: string;
    durationMs: number;
    color: MILESTONE_COLOR;
};

type MILESTONE_COLOR = {
    border: string;
    bg: string;
    iconBg: string;
    text: string;
}

const hours = (value: number) => value * 60 * 60 * 1000;
const days = (value: number) => value * 24 * 60 * 60 * 1000;


const MILESTONE_COLOR = {
    BLUE: { border: '#60a5fa', bg: 'rgba(96, 165, 250, 0.16)', iconBg: 'rgba(96, 165, 250, 0.22)', text: '#dbeafe' },
    INDIGO: { border: '#818cf8', bg: 'rgba(129, 140, 248, 0.16)', iconBg: 'rgba(129, 140, 248, 0.22)', text: '#e0e7ff' },
    VIOLET: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.16)', iconBg: 'rgba(139, 92, 246, 0.22)', text: '#ede9fe' },
    PURPLE: { border: '#a78bfa', bg: 'rgba(167, 139, 250, 0.16)', iconBg: 'rgba(167, 139, 250, 0.22)', text: '#ede9fe' },
    FUCHSIA: { border: '#e879f9', bg: 'rgba(232, 121, 249, 0.16)', iconBg: 'rgba(232, 121, 249, 0.22)', text: '#f5d0fe' },
    PINK: { border: '#f472b6', bg: 'rgba(244, 114, 182, 0.16)', iconBg: 'rgba(244, 114, 182, 0.22)', text: '#fbcfe8' },
    ROSE: { border: '#fb7185', bg: 'rgba(251, 113, 133, 0.16)', iconBg: 'rgba(251, 113, 133, 0.22)', text: '#ffe4e6' },
    RED: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.16)', iconBg: 'rgba(239, 68, 68, 0.22)', text: '#fecaca' },
    SKY: { border: '#38bdf8', bg: 'rgba(56, 189, 248, 0.16)', iconBg: 'rgba(56, 189, 248, 0.22)', text: '#cffafe' },
    CYAN: { border: '#22d3ee', bg: 'rgba(34, 211, 238, 0.16)', iconBg: 'rgba(34, 211, 238, 0.22)', text: '#a5f3fc' },
    YELLOW: { border: '#facc15', bg: 'rgba(250, 204, 21, 0.16)', iconBg: 'rgba(250, 204, 21, 0.22)', text: '#fef9c3' },
}

export const COLD_TURKEY_MILESTONES: ColdTurkeyMilestone[] = [
    { label: '12 hours', shortLabel: '12H', durationMs: hours(12), color: MILESTONE_COLOR.BLUE },
    { label: '1 day', shortLabel: '1D', durationMs: days(1), color: MILESTONE_COLOR.INDIGO },
    { label: '2 days', shortLabel: '2D', durationMs: days(2), color: MILESTONE_COLOR.VIOLET },
    { label: '3 days', shortLabel: '3D', durationMs: days(3), color: MILESTONE_COLOR.PURPLE },
    { label: '5 days', shortLabel: '5D', durationMs: days(5), color: MILESTONE_COLOR.FUCHSIA },
    { label: '1 week', shortLabel: '1W', durationMs: days(7), color: MILESTONE_COLOR.PINK },
    { label: '2 weeks', shortLabel: '2W', durationMs: days(14), color: MILESTONE_COLOR.ROSE },
    { label: '1 month', shortLabel: '1M', durationMs: days(30), color: MILESTONE_COLOR.RED },
    { label: '2 months', shortLabel: '2M', durationMs: days(60), color: MILESTONE_COLOR.SKY },
    { label: '3 months', shortLabel: '3M', durationMs: days(90), color: MILESTONE_COLOR.CYAN },
    { label: '1 year', shortLabel: '1Y', durationMs: days(365), color: MILESTONE_COLOR.YELLOW },
];
