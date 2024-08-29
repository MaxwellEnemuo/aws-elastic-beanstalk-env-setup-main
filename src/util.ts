import { vpcIds, keyNames } from '../src/constants';

export const getVpcId = (environment: string) => {
  switch (environment) {
    case 'staging':
      return vpcIds.STAGING;
    case 'pre-production':
      return vpcIds.PRE_PRODUCTION;
    case 'production':
      return vpcIds.PRODUCTION;
    default:
      throw new Error(`Unknown environment: ${environment}`);
  }
};

export const getEc2KeyName = (environment: string) => {
  switch (environment) {
    case 'production':
      return keyNames.PRODUCTION;
    case 'pre-production':
      return keyNames.PRE_PRODUCTION;
    case 'staging':
    default:
      return keyNames.STAGING;
  }
};
