import json
import os
import requests

def handler(event, context):
    """Get all campaigns with metrics"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
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
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"campaigns": []})
            }
        
        # Get campaigns
        url = f"https://graph.facebook.com/v21.0/{meta_config['ad_account_id']}/campaigns"
        response = requests.get(url, params={
            "access_token": meta_config["access_token"],
            "fields": "id,name,objective,status,daily_budget"
        }, timeout=30)
        
        campaigns_data = response.json()
        campaign_list = []
        
        for campaign in campaigns_data.get("data", []):
            # Get insights for each campaign
            insights_url = f"https://graph.facebook.com/v21.0/{campaign['id']}/insights"
            insights_response = requests.get(insights_url, params={
                "access_token": meta_config["access_token"],
                "fields": "spend,ctr"
            }, timeout=30)
            
            insights = insights_response.json()
            insight_data = insights.get("data", [{}])[0] if insights.get("data") else {}
            
            campaign_list.append({
                "id": campaign["id"],
                "name": campaign["name"],
                "objective": campaign.get("objective", "N/A"),
                "status": campaign.get("status", "PAUSED"),
                "spend": float(insight_data.get("spend", 0)),
                "ctr": float(insight_data.get("ctr", 0))
            })
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"campaigns": campaign_list})
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
