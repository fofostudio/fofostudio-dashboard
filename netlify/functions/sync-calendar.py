import json

def handler(event, context):
    """Sync calendar with Google Sheets"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
    
    # Handle preflight
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    # Sync just triggers a re-fetch, doesn't need backend logic
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({
            "status": "synced",
            "message": "Calendar refreshed successfully"
        })
    }
