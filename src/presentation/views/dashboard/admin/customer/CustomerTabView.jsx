import React from 'react';
import { FrontDeskTabView } from '@/presentation/views/operator/FrontDeskTabView';

// This page is for admin to manage customers and SIMs, reusing the operator's FrontDeskTabView
export default function CustomerTabView(props) {
  // You may want to fetch or pass in admin-specific props here
  // For now, we assume the parent passes the same props as operator
  return <FrontDeskTabView {...props} />;
}
