import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { AuroraPostgresServerless } from './aurora-postgres-serverless';
import { Construct } from 'constructs';


export class MainStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Lookup default VPC
        const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
            isDefault: true,
        });

        // Instantiate the AuroraPostgresServerlessStack
        const auroraPostgresServerless = new AuroraPostgresServerless( {
            vpc,
            scope: this,
        });

        // Create CloudFormation Outputs for the public properties, JSON.stringify non-string properties
        new cdk.CfnOutput(this, 'dbHost', { value: auroraPostgresServerless.dbHost });
        new cdk.CfnOutput(this, 'dbPort', { value: auroraPostgresServerless.dbPort });
        new cdk.CfnOutput(this, 'dbUsername', { value: JSON.stringify(auroraPostgresServerless.dbUsername) });
        new cdk.CfnOutput(this, 'dbPassword', { value: JSON.stringify(auroraPostgresServerless.dbPassword) });
        new cdk.CfnOutput(this, 'dbName', { value: JSON.stringify(auroraPostgresServerless.dbName) });
    }
}
