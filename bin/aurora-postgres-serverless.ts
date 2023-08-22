#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuroraPostgresServerlessStack } from '../lib/aurora-postgres-serverless-stack';

const app = new cdk.App();
new AuroraPostgresServerlessStack(app, 'AuroraPostgresServerlessStack', {
    env: {
        region: process.env.CDK_DEFAULT_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    }
});
