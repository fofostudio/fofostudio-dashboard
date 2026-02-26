"""Google Sheets API helper for Netlify Functions"""

import json
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

def get_sheets_service():
    """Get authenticated Google Sheets service"""
    # Service account credentials from environment
    creds_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT")
    if not creds_json:
        return None
    
    creds_dict = json.loads(creds_json)
    credentials = service_account.Credentials.from_service_account_info(
        creds_dict,
        scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    
    return build("sheets", "v4", credentials=credentials)

def get_spreadsheet_id():
    """Get spreadsheet ID from environment"""
    return os.environ.get("GOOGLE_SPREADSHEET_ID")

def read_sheet(sheet_name="Calendario Marzo 2026"):
    """Read all data from a sheet"""
    try:
        service = get_sheets_service()
        spreadsheet_id = get_spreadsheet_id()
        
        if not service or not spreadsheet_id:
            return []
        
        result = service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=f"{sheet_name}!A:Z"
        ).execute()
        
        return result.get("values", [])
    except Exception as e:
        print(f"Error reading sheet: {e}")
        return []

def update_row(sheet_name, row_index, values):
    """Update a row in the sheet"""
    try:
        service = get_sheets_service()
        spreadsheet_id = get_spreadsheet_id()
        
        if not service or not spreadsheet_id:
            return False
        
        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=f"{sheet_name}!A{row_index}:Z{row_index}",
            valueInputOption="RAW",
            body={"values": [values]}
        ).execute()
        
        return True
    except Exception as e:
        print(f"Error updating row: {e}")
        return False

def clear_row(sheet_name, row_index):
    """Clear a row in the sheet"""
    try:
        service = get_sheets_service()
        spreadsheet_id = get_spreadsheet_id()
        
        if not service or not spreadsheet_id:
            return False
        
        service.spreadsheets().values().clear(
            spreadsheetId=spreadsheet_id,
            range=f"{sheet_name}!A{row_index}:Z{row_index}"
        ).execute()
        
        return True
    except Exception as e:
        print(f"Error clearing row: {e}")
        return False
