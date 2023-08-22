import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface AuroraPostgresServerlessProps {
    vpc: ec2.IVpc;
    vpcSubnets?: ec2.SubnetSelection;
    scope: Construct;
}

export class AuroraPostgresServerless {
    public readonly dbHost: string;
    public readonly dbPort: string;
    public readonly dbUsername: { fromSecret: string | undefined, key: string };
    public readonly dbPassword: { fromSecret: string | undefined, key: string };
    public readonly dbName: { fromSecret: string | undefined, key: string };

    constructor(props: AuroraPostgresServerlessProps) {

        const port = 5432;

        // Use the provided VPC and VPC subnets
        const vpc = props.vpc;
        const vpcSubnets = props.vpcSubnets || vpc.selectSubnets({
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        });

        // create a security group for aurora db
        const securityGroup = new ec2.SecurityGroup(props.scope, 'DbSecurityGroup', {
            vpc,
            allowAllOutbound: true,
            description: 'Security Group for Aurora Postgres DB',
        });

        // allow inbound traffic from anywhere on port 5432
        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(port),
            'allow inbound traffic from anywhere to the db on port 5432'
        );


        // create a serverless aurora postgres db
        const db = new rds.DatabaseCluster(props.scope, 'DbCluster', {
            engine: rds.DatabaseClusterEngine.auroraPostgres({
                version: rds.AuroraPostgresEngineVersion.VER_14_8,
            }),
            securityGroups: [securityGroup],
            subnetGroup: new rds.SubnetGroup(props.scope, 'DbSubnetGroup', {
                description: 'Databases',
                vpc,
                vpcSubnets,
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

        // Store db endpoint as public properties
        this.dbHost = db.clusterEndpoint.hostname;
        this.dbPort = db.clusterEndpoint.port.toString();

        // Store username, password, and db name as public properties
        this.dbUsername = {
            fromSecret: db.secret?.secretArn,
            key: 'username',
        };
        this.dbPassword = {
            fromSecret: db.secret?.secretArn,
            key: 'password',
        };
        this.dbName = {
            fromSecret: db.secret?.secretArn,
            key: 'dbname',
        };
    }
}
