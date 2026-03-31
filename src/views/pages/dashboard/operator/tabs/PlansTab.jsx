import React from 'react';
import { PlansManagement } from '@/views/components/plan/PlansManagement';

export const PlansTab = ({ plans }) => {
  return <PlansManagement plans={plans} canEdit={false} />;
};