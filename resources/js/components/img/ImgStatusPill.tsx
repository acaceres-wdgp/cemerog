import React from 'react';
import { cn } from '@/lib/utils';
import { IMG_STATUS } from './types';
import type { ImagingStatus } from './types';

export default function ImgStatusPill({ status }: { status: ImagingStatus }) {
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-[10px] py-[3px] text-[12px] font-medium whitespace-nowrap',
                IMG_STATUS[status].pill,
            )}
        >
            {IMG_STATUS[status].label}
        </span>
    );
}
