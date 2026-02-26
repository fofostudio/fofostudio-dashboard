"""Simple test function"""
import json

def handler(event, context):
    """Test handler"""
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({"message": "Functions are working!", "test": True})
    }
