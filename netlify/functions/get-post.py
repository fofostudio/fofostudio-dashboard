import json
from urllib.parse import parse_qs

def handler(event, context):
    """Get single post detail"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
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
        
        # TODO: Fetch from Google Sheets
        # For now, return mock data
        mock_post = {
            "id": post_id,
            "sheet_name": "Calendario Marzo 2026",
            "row_index": 2,
            "date": "2026-03-05",
            "time": "12:00",
            "title": "Post educativo: Tips de diseño",
            "description": "Comparte consejos prácticos sobre diseño web",
            "type": "feed",
            "platform": "both",
            "image_url": "",
            "status": "scheduled"
        }
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(mock_post)
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
