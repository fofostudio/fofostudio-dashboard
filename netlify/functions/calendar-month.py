import json
import os
import requests
from datetime import datetime

def handler(event, context):
    """Get all posts for a specific month from Google Sheets"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
    
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        # Parse query params
        query_params = event.get("queryStringParameters") or {}
        year = int(query_params.get("year", datetime.now().year))
        month = int(query_params.get("month", datetime.now().month))
        month_str = f"{year}-{str(month).zfill(2)}"
        
        # Get user's access token from Authorization header
        auth_header = event.get("headers", {}).get("authorization") or event.get("headers", {}).get("Authorization")
        access_token = None
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header[7:]
        
        posts = []
        
        # Try to read from Google Sheets if user is authenticated
        if access_token:
            spreadsheet_id = os.environ.get("GOOGLE_SPREADSHEET_ID")
            if spreadsheet_id:
                posts = read_sheets_data(access_token, spreadsheet_id, year, month, month_str)
        
        # Fallback to mock data if no auth or error
        if not posts:
            posts = get_mock_posts(year, month, month_str)
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"posts": posts})
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e), "posts": []})
        }

def read_sheets_data(access_token, spreadsheet_id, year, month, month_str):
    """Read data from Google Sheets using user's OAuth token"""
    posts = []
    
    try:
        # Read both feed and stories sheets
        for sheet_name in ["Calendario Marzo 2026", "Calendario Stories IG"]:
            url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{sheet_name}!A:Z"
            response = requests.get(
                url,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30
            )
            
            if response.status_code != 200:
                continue
            
            data = response.json()
            rows = data.get("values", [])
            
            if len(rows) < 2:
                continue
            
            # Skip header row
            for i, row in enumerate(rows[1:], start=2):
                if len(row) < 3:
                    continue
                
                date_str = row[0] if len(row) > 0 else ""
                
                # Filter by month
                if not date_str.startswith(month_str):
                    continue
                
                post = {
                    "id": f"{sheet_name}_{i}",
                    "sheet_name": sheet_name,
                    "row_index": i,
                    "date": date_str,
                    "time": row[1] if len(row) > 1 else "",
                    "title": row[2] if len(row) > 2 else "",
                    "description": row[3] if len(row) > 3 else "",
                    "type": "story" if "Stories" in sheet_name else "feed",
                    "platform": row[4] if len(row) > 4 else "both",
                    "image_url": row[5] if len(row) > 5 else "",
                    "status": determine_status(date_str, row[1] if len(row) > 1 else "")
                }
                posts.append(post)
    
    except Exception as e:
        print(f"Error reading sheets: {e}")
    
    return posts

def determine_status(date_str, time_str):
    """Determine post status based on date/time"""
    try:
        if not date_str:
            return "scheduled"
        
        from datetime import datetime, timedelta
        post_datetime = datetime.strptime(f"{date_str} {time_str or '00:00'}", "%Y-%m-%d %H:%M")
        now = datetime.now()
        
        if post_datetime > now:
            return "scheduled"
        elif post_datetime < now - timedelta(hours=2):
            return "published"
        else:
            return "scheduled"
    except:
        return "scheduled"

def get_mock_posts(year, month, month_str):
    """Return mock posts for testing"""
    return [
        {
            "id": "feed_1",
            "sheet_name": "Calendario Marzo 2026",
            "row_index": 2,
            "date": f"{month_str}-05",
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
            "date": f"{month_str}-05",
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
            "date": f"{month_str}-10",
            "time": "15:00",
            "title": "Caso de éxito: Cliente TechCorp",
            "description": "Resultados de +150% engagement",
            "type": "feed",
            "platform": "both",
            "image_url": "",
            "status": "scheduled"
        },
        {
            "id": "feed_3",
            "sheet_name": "Calendario Marzo 2026",
            "row_index": 4,
            "date": f"{month_str}-15",
            "time": "14:00",
            "title": "Tendencia: Diseño minimalista 2026",
            "description": "Explora las tendencias de diseño web",
            "type": "feed",
            "platform": "both",
            "image_url": "",
            "status": "scheduled"
        },
        {
            "id": "story_2",
            "sheet_name": "Calendario Stories IG",
            "row_index": 3,
            "date": f"{month_str}-20",
            "time": "19:00",
            "title": "Story: Tips rápidos",
            "description": "3 consejos de productividad",
            "type": "story",
            "platform": "instagram",
            "image_url": "",
            "status": "scheduled"
        },
        {
            "id": "feed_4",
            "sheet_name": "Calendario Marzo 2026",
            "row_index": 5,
            "date": f"{month_str}-25",
            "time": "16:00",
            "title": "Webinar: Futuro del diseño",
            "description": "Charla con expertos de la industria",
            "type": "feed",
            "platform": "both",
            "image_url": "",
            "status": "scheduled"
        }
    ]
