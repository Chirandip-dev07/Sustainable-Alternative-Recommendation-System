import urllib.request
import json
import os

def test_api(payload):
    req = urllib.request.Request(
        "http://localhost:9000/api/scan",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as res:
            return {
                "status": res.status,
                "data": json.loads(res.read().decode("utf-8"))
            }
    except Exception as e:
        return {"error": str(e)}

results = []
results.append(test_api({"text": "paper cup"}))
results.append(test_api({"image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}))
results.append(test_api({"image": "data:image/png;base64,yetanotherdifferentimageforthescannerendpointtouse"}))

with open("api_test_out.json", "w") as f:
    json.dump(results, f, indent=2)
print("Done!")
