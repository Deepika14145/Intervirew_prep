# lexProxy Lambda

Proxies chat messages from the IntervAI frontend to Amazon Lex V2.

## Configuration (already set in index.mjs)
| Variable | Value |
|---|---|
| Bot ID | `HP47YEOH8M` |
| Alias ID | `PNDWA5KGB1` |
| Region | `ap-southeast-1` |

---

## How to Deploy (AWS Console)

### Step 1 — Create the Lambda Function
1. Go to **AWS Console → Lambda → Create function**
2. Select **"Author from scratch"**
3. **Function name**: `lexProxy`
4. **Runtime**: `Node.js 20.x`
5. **Architecture**: `x86_64`
6. Click **Create function**

### Step 2 — Upload the code
1. In the Lambda console, scroll to **"Code source"**
2. Click **"Upload from" → ".zip file"**  
   _OR_ click the file tree on the left → open `index.mjs` → paste the contents of this folder's `index.mjs`
3. Make sure the handler is set to `index.handler` (it will be by default)
4. Click **Deploy**

### Step 3 — Add Lex permissions to the Lambda role
1. In the Lambda console → **Configuration → Permissions**
2. Click the **Role name** link (opens IAM)
3. Click **Add permissions → Attach policies**
4. Search for `AmazonLexRunBotsOnly` → **Add permissions**

### Step 4 — Add API Gateway trigger
1. Back in Lambda → **Add trigger**
2. Select **API Gateway**
3. Choose **"Create a new API"**
4. API type: **HTTP API** (cheaper + simpler)
5. Security: **Open** (we'll add auth later)
6. Click **Add**
7. ✅ Copy the **API endpoint URL** shown — you'll need it for the frontend

### Step 5 — Wire up the frontend
1. Create `d:\Intervirew_prep\app\.env.local` with:
   ```
   VITE_CHAT_API_URL=https://YOUR_API_ID.execute-api.ap-southeast-1.amazonaws.com/YOUR_STAGE
   ```
2. Restart `npm run dev`
3. Open the chatbot widget and type a message — it now goes to Lex!

---

## Testing the Lambda directly

In the Lambda console → **Test** tab, create a test event:
```json
{
  "httpMethod": "POST",
  "body": "{\"message\": \"Give me interview tips\", \"sessionId\": \"test-123\"}"
}
```
Expected response:
```json
{
  "statusCode": 200,
  "body": "{\"messages\": [\"Quick tip: Always follow the STAR method...\"]}"
}
```
