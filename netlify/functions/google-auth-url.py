"""Generate Google OAuth URL"""
import json
import os
from urllib.parse import urlencode

def handler(event, context):
    """Generate Google OAuth URL"""
    
    # CORS headers
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
    
    # Handle preflight
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }
    
    try:
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
        
        if not client_id or not redirect_uri:
            return {
                "statusCode": 500,
                "headers": headers,
                "body": json.dumps({
                    "error": "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI in Netlify Environment Variables"
                })
            }
        
        # OAuth parameters
        params = {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": " ".join([
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive.readonly",
                "openid",
                "email",
                "profile"
            ]),
            "access_type": "offline",
            "prompt": "consent"  # Force to get refresh token
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"url": auth_url})
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
