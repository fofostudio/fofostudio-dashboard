import json
import os
import requests

def handler(event, context):
    """Check health status of all integrations"""
    
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
    }
    
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}
    
    try:
        # Get user's access token if authenticated
        auth_header = event.get("headers", {}).get("authorization") or event.get("headers", {}).get("Authorization")
        google_access_token = None
        if auth_header and auth_header.startswith("Bearer "):
            google_access_token = auth_header[7:]
        
        health = {
            "meta": check_meta_health(),
            "google_oauth": check_google_oauth(google_access_token),
            "google_sheets": check_google_sheets(google_access_token),
            "google_drive": check_google_drive(google_access_token),
            "config": get_config_status()
        }
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps(health)
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }

def check_meta_health():
    """Check Meta Ads API connection"""
    meta_token = os.environ.get("META_ACCESS_TOKEN")
    ad_account_id = os.environ.get("META_AD_ACCOUNT_ID")
    
    if not meta_token or not ad_account_id:
        return {
            "status": "not_configured",
            "message": "Meta credentials not configured",
            "configured": False
        }
    
    try:
        # Test API call
        url = f"https://graph.facebook.com/v21.0/{ad_account_id}"
        response = requests.get(url, params={
            "access_token": meta_token,
            "fields": "name,account_status"
        }, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                "status": "connected",
                "message": f"Connected to {data.get('name', 'Unknown')}",
                "configured": True,
                "account_name": data.get("name"),
                "account_status": data.get("account_status")
            }
        else:
            error_data = response.json()
            return {
                "status": "error",
                "message": error_data.get("error", {}).get("message", "API error"),
                "configured": True
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "configured": True
        }

def check_google_oauth(access_token):
    """Check Google OAuth status"""
    if not access_token:
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        if not client_id:
            return {
                "status": "not_configured",
                "message": "Google OAuth not configured",
                "configured": False
            }
        return {
            "status": "not_authenticated",
            "message": "OAuth configured but user not logged in",
            "configured": True
        }
    
    try:
        # Verify token with userinfo endpoint
        response = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            user_info = response.json()
            return {
                "status": "connected",
                "message": f"Logged in as {user_info.get('email')}",
                "configured": True,
                "user_email": user_info.get("email"),
                "user_name": user_info.get("name")
            }
        else:
            return {
                "status": "error",
                "message": "Invalid or expired token",
                "configured": True
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "configured": True
        }

def check_google_sheets(access_token):
    """Check Google Sheets API access"""
    if not access_token:
        return {
            "status": "not_authenticated",
            "message": "Login with Google to access Sheets",
            "configured": False
        }
    
    spreadsheet_id = os.environ.get("GOOGLE_SPREADSHEET_ID")
    if not spreadsheet_id:
        return {
            "status": "warning",
            "message": "No spreadsheet ID configured (using mock data)",
            "configured": False
        }
    
    try:
        # Test read access
        url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}"
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {access_token}"},
            params={"fields": "properties(title)"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            title = data.get("properties", {}).get("title", "Unknown")
            return {
                "status": "connected",
                "message": f"Connected to: {title}",
                "configured": True,
                "spreadsheet_title": title
            }
        else:
            return {
                "status": "error",
                "message": "Cannot access spreadsheet",
                "configured": True
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "configured": True
        }

def check_google_drive(access_token):
    """Check Google Drive API access"""
    if not access_token:
        return {
            "status": "not_authenticated",
            "message": "Login with Google to access Drive",
            "configured": False
        }
    
    try:
        # Test Drive access
        url = "https://www.googleapis.com/drive/v3/about"
        response = requests.get(
            url,
            headers={"Authorization": f"Bearer {access_token}"},
            params={"fields": "user,storageQuota"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            quota = data.get("storageQuota", {})
            
            used_gb = int(quota.get("usage", 0)) / (1024**3)
            limit_gb = int(quota.get("limit", 0)) / (1024**3)
            
            return {
                "status": "connected",
                "message": f"Connected as {user.get('emailAddress')}",
                "configured": True,
                "storage_used_gb": round(used_gb, 2),
                "storage_limit_gb": round(limit_gb, 2)
            }
        else:
            return {
                "status": "error",
                "message": "Cannot access Drive",
                "configured": True
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "configured": True
        }

def get_config_status():
    """Get current configuration status"""
    return {
        "meta": {
            "access_token_set": bool(os.environ.get("META_ACCESS_TOKEN")),
            "ad_account_id": os.environ.get("META_AD_ACCOUNT_ID", "Not set")
        },
        "google_oauth": {
            "client_id_set": bool(os.environ.get("GOOGLE_CLIENT_ID")),
            "client_secret_set": bool(os.environ.get("GOOGLE_CLIENT_SECRET")),
            "redirect_uri": os.environ.get("GOOGLE_REDIRECT_URI", "Not set")
        },
        "google_sheets": {
            "spreadsheet_id": os.environ.get("GOOGLE_SPREADSHEET_ID", "Not set")
        }
    }
