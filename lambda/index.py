# =============================================================================
# Hai Tran 11 APR 2022
# boto3 client is low level, resource is high level OOP
# =============================================================================
import decimal
import json
import boto3
from boto3.dynamodb.conditions import Key

db = boto3.resource('dynamodb')
table = db.Table('IoTTableDemo')


def test_scan_table():
    """
    """
    items = table.scan(
        TableName='IoTTableDemo',
        FilterExpression=Key('id').begins_with(str('device01')),
        Limit=10
    )
    # print(items)
    return items


def test_query_table():
    """
    """
    items = table.query(
        TableName='IoTTableDemo',
        KeyConditionExpression=Key('id').eq('device01'),
        Limit=20,
        ScanIndexForward=False
    )
    print(items)
    return items


def default_type_error_handler(obj):
    if isinstance(obj, decimal.Decimal):
        return int(obj)
    raise TypeError


def handler(event, context):
    # query by device id
    items = test_query_table()
    # return
    return {
        'statusCode': 200,
        'headers': {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "OPTIONS,GET"
        },
        'body': json.dumps(items, default=default_type_error_handler)
    }


# test
if __name__ == "__main__":
    res = handler(event=None, context=None)
    print(res)
    # test_scan_table()
    # test_query_table()
