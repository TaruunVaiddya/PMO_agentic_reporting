'use client';

import React from 'react';
import { PaginatedBaseLayout } from './paginated-base-layout';
import type { PaginatedLayoutProps } from './paginated-base-layout';

/**
 * A4 Portrait layout  —  210 × 297 mm
 *
 * Thin wrapper around PaginatedBaseLayout with orientation pre-set.
 * All props are forwarded as-is.
 */
export const A4PortraitLayout: React.FC<Omit<PaginatedLayoutProps, 'orientation'>> = (props) => (
  <PaginatedBaseLayout {...props} orientation="portrait" />
);

export default A4PortraitLayout;