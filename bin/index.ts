import * as cdk from 'aws-cdk-lib';
import { ElasticBeanstalkStack } from '../lib/cdk-elasticbeanstalk-stack';

const app = new cdk.App();

new ElasticBeanstalkStack(app, 'ElasticBeanstalk', {
  description: 'AWS CDK Elastic Beanstalk setup',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
