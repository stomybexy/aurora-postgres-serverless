import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as core from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class AuroraPostgresServerlessStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const port = 5432;

        // lookup default vpc
        const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
            isDefault: true,
        });

        // create a security group for aurora db
        const securityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
            vpc,
            allowAllOutbound: true,
        });

        // allow inbound traffic from anywhere on port 5432
        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(port),
            'allow inbound traffic from anywhere to the db on port 5432'
        );

        // create a serverless aurora postgres db
        const db = new rds.DatabaseCluster(this, 'DbCluster', {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_14_8,
            }),
            securityGroups: [securityGroup],
            subnetGroup: new rds.SubnetGroup(this, 'DbSubnetGroup', {
                description: 'Databases',
                vpc,
                vpcSubnets: vpc.selectSubnets({
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                })
            }),
            vpc,
            writer: rds.ClusterInstance.serverlessV2('Writer'),
            instanceUpdateBehaviour: rds.InstanceUpdateBehaviour.ROLLING,
            defaultDatabaseName: 'serverless',
            credentials: rds.Credentials.fromGeneratedSecret('serverless'),
            serverlessV2MinCapacity: 0.5,
            serverlessV2MaxCapacity: 2,
            port,
        });

        // output db endpoint
        new core.CfnOutput(this, 'dbHost', { value: db.clusterEndpoint.hostname });
        new core.CfnOutput(this, 'dbPort', { value: db.clusterEndpoint.port.toString() });

        new core.CfnOutput(this, 'dbUsername', {
            value: JSON.stringify({
                fromSecret: db.secret?.secretArn,
                key: 'username'
            })
        });
        new core.CfnOutput(this, 'dbPassword', {
            value: JSON.stringify({
                fromSecret: db.secret?.secretArn,
                key: 'password'
            })
        });

        // export db name
        new core.CfnOutput(this, 'dbName', {
            value: JSON.stringify({
                fromSecret: db.secret?.secretArn,
                key: 'dbname'
            })
        });
    }
}
