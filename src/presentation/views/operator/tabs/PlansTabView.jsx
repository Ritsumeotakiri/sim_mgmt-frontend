import React from 'react';
import { PlansManagement } from '@/presentation/views/components/plan/PlansManagement';

export const PlansTabView = ({ plans }) => {
  return <PlansManagement plans={plans} canEdit={false} />;
};
