import json

def handler(event, context):
    """Update post in Google Sheets"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "PUT, OPTIONS"
    }
    
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        # Get post ID from query params
        query_params = event.get("queryStringParameters", {})
        post_id = query_params.get("id")
        
        if not post_id:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Missing post ID"})
            }
        
        # Parse body
        body = json.loads(event.get("body", "{}"))
        
        # TODO: Update in Google Sheets
        # For now, just return success
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "status": "updated",
                "message": "Post update not yet implemented. Coming soon!"
            })
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
