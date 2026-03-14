"use client";

import React from 'react';
import { OriginalLayout, ReportLayoutProps } from './layouts/original-layout';
import { A4PortraitLayout } from './layouts/a4-portrait-layout';
import { A4LandscapeLayout } from './layouts/a4-landscape-layout';
import { PageOrientation } from './viewer-controls';

export interface WebPreviewBodyProps extends ReportLayoutProps {
    orientation?: PageOrientation;
}

export const WebPreviewBody: React.FC<WebPreviewBodyProps> = (props) => {
    if (props.orientation === 'original') {
        return <OriginalLayout {...props} />;
    }
    if (props.orientation === 'landscape') {
        return <A4LandscapeLayout {...props} />;
    }
    return <A4PortraitLayout {...props} />;
};
