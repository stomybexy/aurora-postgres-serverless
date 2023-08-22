import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template } from 'aws-cdk-lib/assertions';
import { Construct } from 'constructs';
import { AuroraPostgresServerless } from '../lib/aurora-postgres-serverless';

export class TestStack extends cdk.Stack {
    public readonly auroraPostgresServerless: AuroraPostgresServerless;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create a VPC with public and private subnets
        const vpc = new ec2.Vpc(this, 'MyTestVpc', {
            maxAzs: 3, // Default is all AZs in region
            subnetConfiguration: [
                {
                    subnetType: ec2.SubnetType.PUBLIC,
                    name: 'Public',
                },
                {
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name: 'Private',
                },
            ],
        });

        // Instantiate the stack under test and assign it to the public property
        this.auroraPostgresServerless = new AuroraPostgresServerless({ vpc, scope: this });
    }
}

test('Aurora PostgreSQL Serverless Cluster Created', () => {
    const app = new cdk.App();
    // WHEN
    const testStack = new TestStack(app, 'MyTestStack');
    // THEN
    const template = Template.fromStack(testStack);

    template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        Port: 5432,
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security Group for Aurora Postgres DB',
    });
});
