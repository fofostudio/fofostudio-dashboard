import json
import os
import requests

def handler(event, context):
    """Pause all active campaigns"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
    
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        meta_config = {
            "access_token": os.environ.get("META_ACCESS_TOKEN"),
            "ad_account_id": os.environ.get("META_AD_ACCOUNT_ID")
        }
        
        if not meta_config["access_token"]:
            return {
                "statusCode": 403,
                "headers": headers,
                "body": json.dumps({"error": "Meta credentials not configured"})
            }
        
        # Get campaigns
        url = f"https://graph.facebook.com/v21.0/{meta_config['ad_account_id']}/campaigns"
        response = requests.get(url, params={
            "access_token": meta_config["access_token"],
            "fields": "id,status"
        }, timeout=30)
        
        campaigns = response.json()
        paused_count = 0
        
        for campaign in campaigns.get("data", []):
            if campaign.get("status") == "ACTIVE":
                # Pause campaign
                pause_url = f"https://graph.facebook.com/v21.0/{campaign['id']}"
                requests.post(pause_url, data={
                    "access_token": meta_config["access_token"],
                    "status": "PAUSED"
                }, timeout=30)
                paused_count += 1
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"paused": paused_count})
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
