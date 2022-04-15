import simple_pubsub
import time


awshost = 'a2tfs6uw3j7iz3-ats.iot.ap-southeast-1.amazonaws.com'
awsport = 8883
thingName = "DemoDevice"
caPath = "./certificate/AmazonRootCA1.pem"
certPath = "./certificate/file-certificate.pem.crt"
keyPath = "./certificate/file-private.pem.key"


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
