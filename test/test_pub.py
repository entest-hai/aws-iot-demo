import simple_pubsub
import time
import json
import random
import math
from concurrent.futures import ThreadPoolExecutor


awshost = 'a2tfs6uw3j7iz3-ats.iot.ap-southeast-1.amazonaws.com'
thingName = "DemoDevice"
caPath = "./certificate/AmazonRootCA1.pem"
certPath = "./certificate/8afc0605402dbff4f8d8382f04a78b384a59637be0f6acd27b59cf4c84fcf028-certificate.pem.crt"
keyPath = "./certificate/8afc0605402dbff4f8d8382f04a78b384a59637be0f6acd27b59cf4c84fcf028-private.pem.key"


def publish_tempature():
    """
    """
    # create topic
    topic = 'topic/subtopic'
    # create publisher
    pub = simple_pubsub.SimpleMQTTPublisher(
        awshost=awshost,
        awsport=8883,
        clientID='testDevice',
        thingName=thingName,
        caPath=caPath,
        certPath=certPath,
        keyPath=keyPath,
        topic=topic
    )
    # keep publising data into the topic
    while True:
        tempature = random.randint(30, 34)
        message = json.dumps(
            {'id': 'device01', 'tempature': tempature, 'location': 'Hanoi'})
        pub.send_data(message)
        time.sleep(3)


def publish_signal():
    """
    """
    # create topic
    topic = 'topic/signal'
    # create publisher
    pub = simple_pubsub.SimpleMQTTPublisher(
        awshost=awshost,
        awsport=8883,
        clientID='testDevice',
        thingName=thingName,
        caPath=caPath,
        certPath=certPath,
        keyPath=keyPath,
        topic=topic
    )
    # sine wave period
    period = 20
    # counter
    count = 0
    # keep publising data into the topic
    while True:
        signal = 20 * math.sin(2.0 * math.pi * count / period)
        count = count + 1
        message = json.dumps(
            {'id': 'device01', 'signal': signal, 'location': 'Hanoi'})
        pub.send_data(message)
        time.sleep(2)


if __name__ == "__main__":
    # publish_signal()
    with ThreadPoolExecutor(max_workers=2) as executor:
        executor.submit(publish_signal)
        executor.submit(publish_tempature)
