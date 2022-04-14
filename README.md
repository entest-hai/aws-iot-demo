# AWS IoT Demo with CDK and Amplify 

## Architecture 

![aws_devops-Expriment (2)](https://user-images.githubusercontent.com/20411077/163437200-3690b0c2-b3de-4257-a54c-995a6de32ada.jpg)

- CDK 
    - Create an IoT thing, attach a policy to X509 certificate, then attach the cert to the IoT thing
    - Create IoT rules to deliver data to Kinesis Firehose, DB
    - Create a Lambda function to query from DB 
-  Amplify 
    - Cognito and PubSub to subscribe to IoT topics 
    - Attach an AWS IoT policy to the Cognito ID
    - Pre-built authentication UI (useAuthenticator)
- CharJs
    - Plot and update two simple charts 
    - Chart 1. Keep pulling data from DB via an API
    - Chart 2. Subscribe to an IoT topic 

## Check AWS IoT Service Endpoint 
```
aws iot describe-endpoint --region ap-southeast-1
```

## Create a CA certificate 
```
openssl genrsa -out root_CA_key_filename.key 2048
```
```
openssl req -x509 -new -nodes \
    -key root_CA_key_filename.key \
    -sha256 -days 1024 \
    -out root_CA_cert_filename.pem
```
[reference](https://docs.aws.amazon.com/iot/latest/developerguide/create-your-CA-cert.html)

## Download AWS CA certificate 
```
    https://www.amazontrust.com/repository/AmazonRootCA1.pem \
    https://www.amazontrust.com/repository/AmazonRootCA2.pem \
    https://www.amazontrust.com/repository/AmazonRootCA3.pem \
    https://www.amazontrust.com/repository/AmazonRootCA4.pem \
```
[reference](https://github.com/aws-samples/aws-iot-device-management-workshop/blob/master/bin/create-root-ca-bundle.sh) and [here](https://docs.aws.amazon.com/iot/latest/developerguide/server-authentication.html#server-authentication-certs)

## Create key and certificate 
```
aws iot create-keys-and-certificate \
--set-as-active \
--certificate-pem-outfile esp-certificate.crt \
--public-key-outfile esp-public.key \
--private-key-outfile esp-private.key \
--region ap-southeast-1
```
take not the **CERTIFICATE_ARN**

## Download certificate 
configure aws cli output as text 
```
aws configure 
```
```
aws iot describe-certificate --certificate-id 
```

## Create an IoT policy 
```
 POLICY_NAME=${THING_NAME}_Policy
  aws iot create-policy --policy-name $POLICY_NAME \
    --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action": "iot:*","Resource":"*"}]}'
```

## Attach the policy to the certificate 
```
aws iot attach-policy --policy-name $POLICY_NAME \
    --target $CERTIFICATE_ARN
```

## Attach the certificate to the thing 
```
aws iot attach-thing-principal --thing-name $THING_NAME \
    --principal $CERTIFICATE_ARN
```



## Reference 
[1](https://aws-quickstart.github.io/quickstart-iot-connectivity-security/)


## 
```
aws iot attach-policy --policy-name 'PolicyForDemoDevice' --target ap-southeast-1:41f19265-5ecd-4c86-8b34-cc58dee6c2f0
aws iot attach-policy --policy-name 'PolicyForDemoDevice' --target ap-southeast-1:2d1afbd5-2d7d-43ec-b906-a40ac2416c10
```