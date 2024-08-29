import 'dotenv/config';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';

import { getVpcId, getEc2KeyName } from '../src/util';

export class ElasticBeanstalkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { NODE_ENV, EBS_APPLICATION_NAME } = process.env;

    if (!NODE_ENV || !EBS_APPLICATION_NAME) {
      throw new Error('Environment variables must be specified!');
    }

    const EBS_ENVIRONMENT_NAME = `${EBS_APPLICATION_NAME}-${NODE_ENV}`;
    const PLATFORM = this.node.tryGetContext('platform');
    const VPC_ID = getVpcId(NODE_ENV);
    const EC2_KEY_NAME = getEc2KeyName(NODE_ENV);
    const ACCOUNT_ID = process.env.CDK_DEFAULT_ACCOUNT;

    const settings = {
      nodeEnv: NODE_ENV,
      ebsEnvironmentName: EBS_ENVIRONMENT_NAME,
      applicationName: process.env.EBS_APPLICATION_NAME,
      platform: PLATFORM,
      vpcId: VPC_ID,
      ec2KeyName: EC2_KEY_NAME,
    };
    console.table(settings);

    // VPC
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      vpcId: VPC_ID,
    });

    // Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow HTTP and SSH traffic',
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS traffic');

    // Import existing IAM Role for Elastic Beanstalk service
    const serviceRole = iam.Role.fromRoleArn(
      this,
      'ServiceRole',
      `arn:aws:iam::${ACCOUNT_ID}:role/aws-elasticbeanstalk-service-role`
    );

    // Import existing instance profile
    const instanceProfile = iam.InstanceProfile.fromInstanceProfileName(
      this,
      'InstanceProfile',
      'aws-elasticbeanstalk-ec2-role'
    );

    // Subnets that have auto-assign public IP enabled
    const subnets = vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }).subnetIds.join(',');

    // Elastic Beanstalk Environment
    const ebEnvironment = new elasticbeanstalk.CfnEnvironment(this, 'Environment', {
      environmentName: EBS_ENVIRONMENT_NAME,
      applicationName: process.env.EBS_APPLICATION_NAME!,
      solutionStackName: PLATFORM,
      optionSettings: [
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          value: instanceProfile.instanceProfileName,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'ServiceRole',
          value: serviceRole.roleArn,
        },
        {
          namespace: 'aws:autoscaling:asg',
          optionName: 'MinSize',
          value: '1',
        },
        {
          namespace: 'aws:autoscaling:asg',
          optionName: 'MaxSize',
          value: '1',
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'NODE_ENV',
          value: NODE_ENV,
        },
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'InstanceType',
          value: 't4g.medium',
        },
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'EC2KeyName',
          value: EC2_KEY_NAME,
        },
        {
          namespace: 'aws:ec2:vpc',
          optionName: 'VPCId',
          value: VPC_ID,
        },
        {
          namespace: 'aws:ec2:vpc',
          optionName: 'Subnets',
          value: subnets,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'LoadBalancerType',
          value: 'application',
        },
        {
          namespace: 'aws:elbv2:loadbalancer',
          optionName: 'SecurityGroups',
          value: securityGroup.securityGroupId,
        },
        {
          namespace: 'aws:elbv2:listener:443',
          optionName: 'ListenerEnabled',
          value: 'true',
        },
        {
          namespace: 'aws:elbv2:loadbalancer',
          optionName: 'IdleTimeout',
          value: '60',
        },
      ],
    });

    new cdk.CfnOutput(this, 'EnvironmentEndpointUrlOutput', {
      description: 'The EndpointUrl for the Elastic Beanstalk environment',
      value: `http://${ebEnvironment.attrEndpointUrl}`,
    });
  }
}
