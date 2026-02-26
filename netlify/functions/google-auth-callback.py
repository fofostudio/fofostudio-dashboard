import json
import os
import requests

def handler(event, context):
    """Handle Google OAuth callback and exchange code for tokens"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    }
    
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        # Get authorization code from body
        body = json.loads(event.get("body", "{}"))
        code = body.get("code")
        
        if not code:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Missing authorization code"})
            }
        
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
        
        if not client_id or not client_secret or not redirect_uri:
            return {
                "statusCode": 500,
                "headers": headers,
                "body": json.dumps({"error": "Google OAuth not configured"})
            }
        
        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code"
        }
        
        response = requests.post(token_url, data=token_data, timeout=30)
        tokens = response.json()
        
        if "error" in tokens:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": tokens.get("error_description", "Token exchange failed")})
            }
        
        # Get user info
        user_info_response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
            timeout=30
        )
        user_info = user_info_response.json()
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "expires_in": tokens.get("expires_in"),
                "user": {
                    "email": user_info.get("email"),
                    "name": user_info.get("name"),
                    "picture": user_info.get("picture")
                }
            })
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
