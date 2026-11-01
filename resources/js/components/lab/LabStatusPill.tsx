import React from 'react';
import { cn } from '@/lib/utils';
import { LAB_STATUS } from './types';
import type { LabOrderStatus } from './types';

export default function LabStatusPill({ status }: { status: LabOrderStatus }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-[10px] py-[3px] text-[12px] font-medium whitespace-nowrap',
                LAB_STATUS[status].pill,
            )}
        >
            {LAB_STATUS[status].label}
        </span>
    );
}
