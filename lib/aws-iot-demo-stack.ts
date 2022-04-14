import {
  aws_apigateway,
  aws_dynamodb,
  aws_iam,
  aws_iot,
  aws_lambda,
  aws_s3,
  Duration,
  Stack,
  StackProps
} from 'aws-cdk-lib';
import * as firehose from '@aws-cdk/aws-kinesisfirehose-alpha';
import * as destinations from '@aws-cdk/aws-kinesisfirehose-destinations-alpha';
import { Construct } from 'constructs';
import * as path from 'path';

interface AwsIotDemoStackProps extends StackProps {
  certificateArn: string
}

export class AwsIotDemoStack extends Stack {
  constructor(scope: Construct, id: string, props: AwsIotDemoStackProps) {
    super(scope, id, props);

    // create lambda role 
    const lambdaRole = new aws_iam.Role(
      this,
      'RoleForLambdaReadDDBIoT',
      {
        assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com')
      }
    )

    lambdaRole.attachInlinePolicy(
      new aws_iam.Policy(
        this,
        'PolicyForLambdaReadDDBIoT',
        {
          statements: [
            new aws_iam.PolicyStatement(
              {
                effect: aws_iam.Effect.ALLOW,
                actions: ['dynamodb:*'],
                resources: ['*']
              }
            )
          ]
        }
      )
    )

    // create lambda function 
    const lambda = new aws_lambda.Function(
      this,
      'LambdaReadDDBIoTData',
      {
        functionName: 'LambdaReadDDBIoTData',
        code: aws_lambda.Code.fromAsset(
          path.join(__dirname, './../lambda/')
        ),
        handler: 'index.handler',
        runtime: aws_lambda.Runtime.PYTHON_3_8,
        role: lambdaRole
      }
    )

    // api gateway
    const gw = new aws_apigateway.RestApi(
      this,
      'ApiGatewayIoTDemo',
      {
        restApiName: 'ApiGatewayIoTDemo',
      }
    )

    // apigateway add resource 
    const iotResource = gw.root.addResource('iot')

    // lambda based api integration
    const integration = new aws_apigateway.LambdaIntegration(
      lambda
    )

    // add method 
    iotResource.addMethod(
      'GET',
      integration
    )


    // create a dynamodb table 
    const table = new aws_dynamodb.Table(
      this,
      'IoTTableDemo',
      {
        tableName: 'IoTTableDemo',
        partitionKey: { name: 'id', type: aws_dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: aws_dynamodb.AttributeType.STRING }

      }
    )

    // create kinesis firehose delivery stream 
    const firehoseDeilvery = new firehose.DeliveryStream(
      this,
      'FirehoseDeliveryStreamForIoT',
      {
        destinations: [new destinations.S3Bucket(
          aws_s3.Bucket.fromBucketName(
            this,
            'BucketForIoT',
            'femom-fhr-data'
          ),
          {
            dataOutputPrefix: 'iot/',
            bufferingInterval: Duration.seconds(60)
          }
        )]
      }
    )

    // create a thing 
    const thing = new aws_iot.CfnThing(
      this,
      'DemoDeviceThing', {
      thingName: 'DemoDevice'
    }
    )

    // create a policy 
    const policy = new aws_iot.CfnPolicy(
      this,
      'PolicyForDemoDevice',
      {
        policyName: 'PolicyForDemoDevice',
        policyDocument: new aws_iam.PolicyDocument(
          {
            statements: [
              new aws_iam.PolicyStatement(
                {
                  actions: ['iot:*'],
                  resources: ['*'],
                  effect: aws_iam.Effect.ALLOW
                }
              )
            ]
          }
        )
      }
    )

    // attach the policy to certificate 
    const attachPolicy = new aws_iot.CfnPolicyPrincipalAttachment(
      this,
      'AttachPolicyForDemoDevice',
      {
        policyName: policy.policyName!.toString(),
        principal: props.certificateArn
      }
    )

    attachPolicy.addDependsOn(
      policy
    )

    // attach the certificate to the IoT thing
    const attachCert = new aws_iot.CfnThingPrincipalAttachment(
      this,
      'AttachCertificiateToThing',
      {
        thingName: thing.thingName!.toString(),
        principal: props.certificateArn
      }
    )

    attachCert.addDependsOn(
      thing
    )

    // role for AWS IoT core to write to S3 bucket 
    const role = new aws_iam.Role(
      this,
      'RoleForIoTCoreToAccessS3',
      {
        roleName: 'RoleForIoTCoreToAccessS3',
        assumedBy: new aws_iam.ServicePrincipal('iot.amazonaws.com')
      }
    )

    // enable write to S3 and Kinesis Firehose 
    role.attachInlinePolicy(
      new aws_iam.Policy(
        this,
        'PolicyForIoTcoreToAccessS3',
        {
          policyName: 'PolicyForIoTcoreToAccessS3',
          statements: [
            new aws_iam.PolicyStatement(
              {
                actions: ['s3:*'],
                resources: ['arn:aws:s3:::femom-fhr-data/*']
              }
            ),
            new aws_iam.PolicyStatement(
              {
                actions: ['firehose:*'],
                resources: ['*']
              }
            ),
            new aws_iam.PolicyStatement(
              {
                actions: ['dynamodb:*'],
                resources: ['*']
              }
            )
          ]
        }
      )
    )

    // topic rule 
    const topicRule = new aws_iot.CfnTopicRule(
      this,
      'TopicRuleDemo',
      {
        ruleName: 'TopicRuleDemo',
        topicRulePayload: {
          actions: [
            {
              firehose: {
                deliveryStreamName: firehoseDeilvery.deliveryStreamName,
                roleArn: role.roleArn
              }
            },
            {
              s3: {
                bucketName: 'femom-fhr-data',
                key: 'iot-one',
                roleArn: role.roleArn
              },
            },
            {
              dynamoDb: {
                hashKeyField: 'id',
                hashKeyValue: 'device01',
                hashKeyType: 'STRING',
                rangeKeyField: 'timestamp',
                rangeKeyValue: '${timestamp()}',
                rangeKeyType: 'STRING',
                roleArn: role.roleArn,
                tableName: table.tableName
              }
            }
          ],
          sql: `SELECT *, cast(timestamp() as STRING) AS timestamp FROM 'topic/subtopic'`
        }
      }
    )

  }
}

