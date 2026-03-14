"use client";

import React from 'react';
import { PaginatedBaseLayout } from './paginated-base-layout';
import { ReportLayoutProps } from './original-layout';

export const A4PortraitLayout: React.FC<ReportLayoutProps> = (props) => {
    return <PaginatedBaseLayout {...props} orientation="portrait" />;
};
