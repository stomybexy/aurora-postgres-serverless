#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AuroraPostgresServerlessStack } from '../lib/aurora-postgres-serverless-stack';

const app = new cdk.App();
new AuroraPostgresServerlessStack(app, 'AuroraPostgresServerlessStack');
