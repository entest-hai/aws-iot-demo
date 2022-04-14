import ssl
import paho.mqtt.client as mqtt
import numpy as np


class SimpleMQTTPublisher():
    """
    Create a simple publisher
    """

    def __init__(self, awshost="", awsport=8883, clientID="", thingName="",
                 caPath="", certPath="", keyPath="", topic=""):
        """
        """

        self.awshost = awshost
        self.awsport = awsport
        self.clientId = clientID
        self.thingName = thingName
        self.caPath = caPath
        self.certPath = certPath
        self.keyPath = keyPath
        self.topic = topic
        self.count = 0
        self.create_mqttc()

    # Check if the Connection to AWS Cloud has been Made.
    def on_connect(self, client, userdata, flags, rc):
        global connection_flag
        connection_flag = True
        print("Connection returned result: " + str(rc))

    def on_message(self, client, userdata, msg):
        print(msg.topic + " " + str(msg.payload))

    def create_mqttc(self):
        # Initiate Paho-MQTT Client
        self.mqttc = mqtt.Client()
        self.mqttc.on_connect = self.on_connect
        self.mqttc.on_message = self.on_message

        # Enable SSL/TLS support
        self.mqttc.tls_set(self.caPath, certfile=self.certPath, keyfile=self.keyPath,
                           cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2,
                           ciphers=None)

        # Connect to AWS Host
        self.mqttc.connect(self.awshost, self.awsport, keepalive=60)
        self.mqttc.loop_start()

    def send_data(self, data):
        # print("send a message")
        self.mqttc.publish(self.topic, data, qos=1)
        print("send message {0}".format(self.count))
        self.count = self.count + 1


class SimpleMQTTSubscriber():

    def __init__(self, awshost="", awsport=8883, clienID="", thingName="",
                 caPath="", certPath="", keyPath="", topic="", draw=[],
                 chunkSize=8000, bufferLengthInSecond=4, samplingRate=500,
                 persisting="LIFO", estimateHeartRate=False,
                 heartRateBufferLength=60, NFFT=4096):
        """
        """

        self.awshost = awshost
        self.awsport = awsport
        self.clientId = clienID
        self.thingName = thingName
        self.caPath = caPath
        self.certPath = certPath
        self.keyPath = keyPath
        self.topic = topic
        self.count = 0
        self.chunkSize = chunkSize
        self.bufferLengthInSecond = bufferLengthInSecond
        self.samplingRate = samplingRate
        # save to database or not
        self.persisting = persisting
        self.estimateHeartRate = estimateHeartRate
        # path to store data
        self.database = "data.txt"
        # LIFO size
        self.lifo_size = self.chunkSize*self.bufferLengthInSecond
        # LIFO buffer
        self.lifo_buffer = np.zeros(self.lifo_size)
        # live draw
        self.draw = draw
        # init data base
        self.create_database()
        # init
        self.create_mqttc()
        # cepstrum analyzer
        self.NFFT = NFFT

    def on_connect(self, client, userdata, flags, rc):
        print("Connection returned result: " + str(rc))
        client.subscribe(self.topic, 1)

    def on_message(self, client, userdata, msg):
        print("topic: " + msg.topic)
        print("receive message {0}".format(self.count))
        self.count = self.count + 1

        # process message
        print(msg.payload)

    def create_mqttc(self):
        self.mqttc = mqtt.Client()
        self.mqttc.on_connect = self.on_connect
        self.mqttc.on_message = self.on_message
        self.mqttc.tls_set(self.caPath, certfile=self.certPath, keyfile=self.keyPath,
                           cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLSv1_2,
                           ciphers=None)

    def receive_data(self):
        self.mqttc.connect(self.awshost, self.awsport, keepalive=60)
        self.mqttc.loop_forever()

    def save_data_to_file(self, data):
        with open(self.database, "ab") as file:
            file.write(data)

    def create_database(self):
        with open(self.database, "wb") as file:
            pass
