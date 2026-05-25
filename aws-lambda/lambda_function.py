import urllib.request
import json

COLLECT_URL = "https://weather-app-chi-pied-98.vercel.app/api/collect"

def lambda_handler(event, context):
    req = urllib.request.Request(COLLECT_URL)
    with urllib.request.urlopen(req, timeout=30) as response:
        body = response.read().decode("utf-8")
        status = response.status

    print(f"status={status} body={body}")
    return {"statusCode": status, "body": body}
