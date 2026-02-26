import json
import os
from datetime import datetime
from urllib.parse import parse_qs

def handler(event, context):
    """Get all posts for a specific month (mock data for now)"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
    
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        # Parse query params
        query_params = event.get("queryStringParameters", {})
        year = int(query_params.get("year", datetime.now().year))
        month = int(query_params.get("month", datetime.now().month))
        
        # TODO: Integrate with Google Sheets API
        # For now, return mock data
        mock_posts = [
            {
                "id": "feed_1",
                "sheet_name": "Calendario Marzo 2026",
                "row_index": 2,
                "date": f"{year}-{str(month).zfill(2)}-05",
                "time": "12:00",
                "title": "Post educativo: Tips de diseño",
                "description": "Comparte consejos prácticos sobre diseño web",
                "type": "feed",
                "platform": "both",
                "image_url": "",
                "status": "scheduled"
            },
            {
                "id": "story_1",
                "sheet_name": "Calendario Stories IG",
                "row_index": 2,
                "date": f"{year}-{str(month).zfill(2)}-05",
                "time": "18:00",
                "title": "Story: Behind the scenes",
                "description": "Muestra el proceso de trabajo",
                "type": "story",
                "platform": "instagram",
                "image_url": "",
                "status": "scheduled"
            },
            {
                "id": "feed_2",
                "sheet_name": "Calendario Marzo 2026",
                "row_index": 3,
                "date": f"{year}-{str(month).zfill(2)}-10",
                "time": "15:00",
                "title": "Caso de éxito: Cliente TechCorp",
                "description": "Resultados de +150% engagement",
                "type": "feed",
                "platform": "both",
                "image_url": "",
                "status": "scheduled"
            }
        ]
        
        # Filter by month
        month_str = f"{year}-{str(month).zfill(2)}"
        filtered_posts = [p for p in mock_posts if p["date"].startswith(month_str)]
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"posts": filtered_posts})
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
