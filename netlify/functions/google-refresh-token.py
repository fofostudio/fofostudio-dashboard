import json
import os
import requests

def handler(event, context):
    """Refresh Google OAuth access token"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
    
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        # Get refresh token from body
        body = json.loads(event.get("body", "{}"))
        refresh_token = body.get("refresh_token")
        
        if not refresh_token:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Missing refresh_token"})
            }
        
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        
        if not client_id or not client_secret:
            return {
                "statusCode": 500,
                "headers": headers,
                "body": json.dumps({"error": "Google OAuth not configured"})
            }
        
        # Refresh token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token"
        }
        
        response = requests.post(token_url, data=token_data, timeout=30)
        tokens = response.json()
        
        if "error" in tokens:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": tokens.get("error_description", "Token refresh failed")})
            }
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "access_token": tokens.get("access_token"),
                "expires_in": tokens.get("expires_in")
            })
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
