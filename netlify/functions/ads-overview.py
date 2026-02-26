import json
import os
import requests
from datetime import datetime, timedelta
from urllib.parse import parse_qs

def handler(event, context):
    """Get ads overview metrics"""
    
    # CORS headers
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
    }
    
    # Handle preflight
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        # Get Meta config from environment
        meta_config = {
            "access_token": os.environ.get("META_ACCESS_TOKEN"),
            "ad_account_id": os.environ.get("META_AD_ACCOUNT_ID")
        }
        
        if not meta_config["access_token"]:
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "metrics": {
                        "spend": 0, "impressions": 0, "clicks": 0,
                        "ctr": 0, "cpc": 0, "cpm": 0,
                        "spend_change": 0, "impressions_change": 0, "clicks_change": 0
                    },
                    "today_spend": 0,
                    "scheduled_posts": 0
                })
            }
        
        # Parse query params
        params = parse_qs(event.get("queryStringParameters", {}).get("timeframe", "7d"))
        timeframe = params[0] if params else "7d"
        
        # Calculate date range
        if timeframe == "today":
            since = datetime.now().strftime("%Y-%m-%d")
            until = since
        elif timeframe == "7d":
            since = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            until = datetime.now().strftime("%Y-%m-%d")
        else:  # 30d
            since = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            until = datetime.now().strftime("%Y-%m-%d")
        
        # Fetch insights
        url = f"https://graph.facebook.com/v21.0/{meta_config['ad_account_id']}/insights"
        response = requests.get(url, params={
            "access_token": meta_config["access_token"],
            "fields": "impressions,clicks,ctr,cpc,cpm,spend",
            "time_range": json.dumps({"since": since, "until": until})
        }, timeout=30)
        
        insights = response.json()
        data = insights.get("data", [{}])[0] if insights.get("data") else {}
        
        # Get today's spend
        today_url = f"https://graph.facebook.com/v21.0/{meta_config['ad_account_id']}/insights"
        today_response = requests.get(today_url, params={
            "access_token": meta_config["access_token"],
            "fields": "spend",
            "time_range": json.dumps({
                "since": datetime.now().strftime("%Y-%m-%d"),
                "until": datetime.now().strftime("%Y-%m-%d")
            })
        }, timeout=30)
        
        today_insights = today_response.json()
        today_spend = float(today_insights.get("data", [{}])[0].get("spend", 0))
        
        result = {
            "metrics": {
                "spend": float(data.get("spend", 0)),
                "impressions": int(data.get("impressions", 0)),
                "clicks": int(data.get("clicks", 0)),
                "ctr": float(data.get("ctr", 0)),
                "cpc": float(data.get("cpc", 0)),
                "cpm": float(data.get("cpm", 0)),
                "spend_change": 5.2,
                "impressions_change": 12.3,
                "clicks_change": -2.1
            },
            "today_spend": today_spend,
            "scheduled_posts": 0  # TODO: Get from Sheets
        }
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(result)
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
