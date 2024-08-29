## Elastic Beanstalk Application + Environment

Launches an Elastic Beanstalk Application and an environment within based on the user specified Platform. (https://docs.aws.amazon.com/cli/latest/reference/elasticbeanstalk/list-platform-versions.html)

Platform ARN: "aarn:aws:elasticbeanstalk:eu-west-1::platform/Node.js 20 running on 64bit Amazon Linux 2023/6.1.6"

### List Platform versions

`aws elasticbeanstalk list-platform-versions --region eu-west-1`

Note: Skipping the exact platform version will make it default to the latest one.

### Instructions

1. Change the platform in "cdk.json"
2. Install and configure the CDK: https://docs.aws.amazon.com/CDK/latest/userguide/install_config.html

```
npm install -g aws-cdk
yarn prepare
yarn eslint .
yarn test
yarn build

cdk bootstrap
cdk diff
cdk synth
cdk deploy
cdk destroy

```
