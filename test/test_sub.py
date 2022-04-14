import simple_pubsub
import time


awshost = 'a2tfs6uw3j7iz3-ats.iot.ap-southeast-1.amazonaws.com'
awsport = 8883
thingName = "DemoDevice"
caPath = "./certificate/AmazonRootCA1.pem"
certPath = "./certificate/8afc0605402dbff4f8d8382f04a78b384a59637be0f6acd27b59cf4c84fcf028-certificate.pem.crt"
keyPath = "./certificate/8afc0605402dbff4f8d8382f04a78b384a59637be0f6acd27b59cf4c84fcf028-private.pem.key"


def sub_topic(topic):
    # create subscriber
    subscriber = simple_pubsub.SimpleMQTTSubscriber(
        awshost=awshost,
        awsport=awsport,
        clienID='',
        thingName=thingName,
        caPath=caPath,
        certPath=certPath,
        keyPath=keyPath, topic=topic
    )
    # subscribe
    subscriber.receive_data()
    # return


if __name__ == "__main__":
    sub_topic('topic/signal')
    sub_topic('topic/subtopic')
