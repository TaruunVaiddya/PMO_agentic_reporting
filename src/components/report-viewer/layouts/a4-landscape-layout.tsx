'use client';

import React from 'react';
import { PaginatedBaseLayout } from './paginated-base-layout';
import type { PaginatedLayoutProps } from './paginated-base-layout';

/**
 * A4 Landscape layout  —  297 × 210 mm
 *
 * Thin wrapper around PaginatedBaseLayout with orientation pre-set.
 * All props are forwarded as-is.
 *
 * Note on scaling:
 * Because landscape pages are physically wider (297mm ≈ 1123px) than
 * portrait (210mm ≈ 794px), the auto-computed fitScale will be lower when the
 * viewer is narrow. This is correct — the page appears smaller to fit the
 * viewer. Users can increase userScale via the toolbar zoom controls.
 * Content always renders at true 1:1 A4 dimensions internally.
 */
export const A4LandscapeLayout: React.FC<Omit<PaginatedLayoutProps, 'orientation'>> = (props) => (
  <PaginatedBaseLayout {...props} orientation="landscape" />
);

export default A4LandscapeLayout;