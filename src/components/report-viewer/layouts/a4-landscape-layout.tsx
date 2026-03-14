"use client";

import React from 'react';
import { PaginatedBaseLayout } from './paginated-base-layout';
import { ReportLayoutProps } from './original-layout';

export const A4LandscapeLayout: React.FC<ReportLayoutProps> = (props) => {
    return <PaginatedBaseLayout {...props} orientation="landscape" />;
};
