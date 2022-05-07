# AWS IoT Demo with CDK and Amplify

## Architecture

![aws_devops-Expriment (2)](https://user-images.githubusercontent.com/20411077/163437200-3690b0c2-b3de-4257-a54c-995a6de32ada.jpg)

- Demo
  - [**demo react web**](https://master.d2s0cqpzgt11ee.amplifyapp.com/) no real-time here because we need to publish data from the test/test_pub.py
  - [**video demo**](https://haitran-swincoffee-demo.s3.ap-southeast-1.amazonaws.com/aws-iot-cdk-amplify-demo.mp4)
  - [GitHub here](https://github.com/entest-hai/aws-iot-demo)
- CDK
  - Create an IoT thing, attach a policy to X509 certificate, then attach the cert to the IoT thing
  - Create IoT rules to deliver data to Kinesis Firehose, DB
  - Create a Lambda function to query from DB
- Amplify
  - Cognito and PubSub to subscribe to IoT topics
  - Attach an AWS IoT policy to the Cognito ID
  - Pre-built authentication UI (useAuthenticator)
- CharJs
  - Plot and update two simple charts
  - Chart 1. Keep pulling data from DB via an API
  - Chart 2. Subscribe to an IoT topic
- IoT Thing and Certificate
  - Attach a X509 certificate to the physical IoT device
  - Attach a AWS IoT policy to the X509 ceritifcate to allow read/write AWS IoT topics
- AWS IoT topic rules
  - Attach a role to a rule to enable AWS IoT rules write to S3, Firehose, DyanmoDB

## Check AWS IoT Service Endpoint

```
aws iot describe-endpoint --region ap-southeast-1
```

## Download AWS CA certificate

- Download one of the CA certificate which required to configure mqtt client. [reference 1](https://github.com/aws-samples/aws-iot-device-management-workshop/blob/master/bin/create-root-ca-bundle.sh) and [reference 2](https://docs.aws.amazon.com/iot/latest/developerguide/server-authentication.html#server-authentication-certs).

```
    https://www.amazontrust.com/repository/AmazonRootCA1.pem \
    https://www.amazontrust.com/repository/AmazonRootCA2.pem \
    https://www.amazontrust.com/repository/AmazonRootCA3.pem \
    https://www.amazontrust.com/repository/AmazonRootCA4.pem \
```

- An alternative way is to create a CA certificate [reference 3](https://docs.aws.amazon.com/iot/latest/developerguide/create-your-CA-cert.html)

```
openssl genrsa -out root_CA_key_filename.key 2048
```

```
openssl req -x509 -new -nodes \
    -key root_CA_key_filename.key \
    -sha256 -days 1024 \
    -out root_CA_cert_filename.pem
```

## Create key and certificate

- I have to create key and certificates from CLI or AWS console. To create them from CDK, follow this custom resource [reference 4](https://github.com/awslabs/aws-iot-greengrass-accelerators/tree/main/v2/base/cdk/lib/IotThingCertPolicy)

```
aws iot create-keys-and-certificate \
--set-as-active \
--certificate-pem-outfile esp-certificate.crt \
--public-key-outfile esp-public.key \
--private-key-outfile esp-private.key \
--region ap-southeast-1
```

- Take note the **CERTIFICATE_ARN**

- Re-download the certificate given its ID
  configure aws cli output as text

```
aws iot describe-certificate --certificate-id
```

## IoT Thing, X509 Certificate, and Policy

To allow the IoT thing can write data to AWS IoT core, we need to attach a X509 certificate the the physical IoT device. We also need to attach a policy to the X509 certificate in AWS to specify ALLOW actions.

- Create a policy for the X509 certificate

```
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
```

- Attach the policy to the X509 certificate

```
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
```

- Attach the X509 certificate to the IoT thing

```
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
```

## IoT Rules and Role

To allow IoT rules to delivery data to other services such as S3, DynamoDB, Firehose, we need to attach a role to each rule.

- Create a role

```
 const role = new aws_iam.Role(
      this,
      'RoleForIoTCoreToAccessS3',
      {
        roleName: 'RoleForIoTCoreToAccessS3',
        assumedBy: new aws_iam.ServicePrincipal('iot.amazonaws.com')
      }
    )
```

- Attach inline policies to the role

```
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
                resources: ['arn:aws:s3:::bucketName/*']
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
```

- Create rules with actions and attached the role

```
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
                bucketName: 'bucketName',
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
```

## Init Amplify backend

```shell
amplify init
```

add auth cognito

```shell
amplify add auth
```

choose user login by email and then push

```shell
amplify push
```

take note the aws-export.js to integerate with Amplify UI

## Configure Cognito AuthRole

Follow step 3 [here](https://docs.amplify.aws/lib/pubsub/getting-started/q/platform/js/#step-2-attach-your-policy-to-your-amazon-cognito-identity). Without this, will be error

```
errorCode: 8, errorMessage: AMQJS0008I Socket closed.
```

Attach below policies to the Cognito Authenticated Role

- AWSIoTDataAccess
- AWSIoTConfigAccess

To locate the AuthRole

- Goto cloudformation console
- Click the stack and find **AuthRole** in logical ID column

## Amplify, Cognito and AWS IoT Policy

To allow Amplify (react web app) subscribe to an AWS IoT topic, we need to attach policy to Conigto ID.

- Find the Cognito ID from the react web app as following

```
import Amplify, { Auth, PubSub } from 'aws-amplify';
Auth.currentCredentials().then(creds => console.log(creds));
```

```
The Cognito ID can be found from the creds log
```

- Attach AWS IoT policy to the Cognito ID as following

```
aws iot attach-policy --policy-name 'PolicyForDemoDevice' --target ap-southeast-1:41f19265-5ecd-4c86-8b34-cc58dee6c2f0
aws iot attach-policy --policy-name 'PolicyForDemoDevice' --target ap-southeast-1:2d1afbd5-2d7d-43ec-b906-a40ac2416c10
```
