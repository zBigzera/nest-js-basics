import { SetMetadata } from '@nestjs/common';
import { RoutePolicies } from '../enum/route-policies.enum';

export const ROUTE_POLICY_KEY = 'RoutePolicy';

export const RoutePolicy = (policy: RoutePolicies) => {
  return SetMetadata(ROUTE_POLICY_KEY, policy);
};
