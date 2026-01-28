# Modal Deployment Guide - GenArabia Voice Agent

Complete guide for deploying GenArabia Voice Agent backend to Modal with instant response times.

## 📋 Prerequisites

1. **Modal Account** - Sign up at [modal.com](https://modal.com)
2. **Hugging Face Token** - From [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
3. **Python 3.9+** installed locally

## 🚀 Step 1: Install Modal CLI

```bash
pip install modal
```

## 🔑 Step 2: Setup Modal Authentication

```bash
modal setup
```

This will open a browser window to authenticate. Follow the prompts.

## 🔐 Step 3: Add Hugging Face Secret

Create a Modal secret with your HF token:

```bash
modal secret create huggingface-secret HF_TOKEN=hf_your_actual_token_here
```

**Replace `hf_your_actual_token_here` with your actual token!**

To verify:
```bash
modal secret list
```

You should see `huggingface-secret` in the list.

## 🧪 Step 4: Test Locally

Before deploying, test the Modal app locally:

```bash
cd "/Users/nourahmed/Desktop/GenArabia/ChatterBox REACT"
modal run modal_api.py
```

This will:
- Download all 4 dialect models from HuggingFace
- Load them into memory
- Run a test generation
- Take ~10-15 minutes on first run (model download)

**Expected output:**
```
✅ ALL 4 MODELS LOADED AND READY!
🧪 Testing generation with text: مرحبا بكم في GenArabia
✅ Test successful!
   Audio size: XXXXX bytes
   Inference time: X.XXs
```

## 🌐 Step 5: Deploy to Modal

Once testing succeeds, deploy:

```bash
modal deploy modal_api.py
```

**This creates your live API!**

You'll see output like:
```
✓ Created web function api_generate => https://your-workspace--genarabia-voice-agent-chatterboxapi-api-generate.modal.run
✓ Created web function health => https://your-workspace--genarabia-voice-agent-chatterboxapi-health.modal.run
✓ Created web function api_samples => ...
✓ Created web function api_dialects => ...
```

**Copy these URLs - you'll need them for the frontend!**

## 📝 Step 6: Note Your API Endpoint

Your main generation endpoint will be:
```
https://YOUR-WORKSPACE--genarabia-voice-agent-chatterboxapi-api-generate.modal.run
```

## 🧪 Step 7: Test the Deployed API

Test the health endpoint:

```bash
curl https://YOUR-WORKSPACE--genarabia-voice-agent-chatterboxapi-health.modal.run
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": ["egyptian", "emirates", "ksa", "kuwaiti"],
  "device": "cuda",
  "num_models": 4
}
```

Test TTS generation:

```bash
curl -X POST "https://YOUR-WORKSPACE--genarabia-voice-agent-chatterboxapi-api-generate.modal.run" \
  -H "Content-Type: application/json" \
  -d '{"text": "مرحبا بكم في GenArabia", "dialect": "egyptian"}' \
  --output test_output.wav
```

You should get a WAV file!

## 📊 Understanding Costs

### Keep Warm Configuration

The API is configured with `keep_warm=1`, meaning:
- ✅ **Instant responses** (no cold start delay)
- ⚠️ **Always-on cost**: ~$0.50/hour for A10G GPU
- 💰 **Monthly estimate**: ~$360/month for 24/7 availability

### Cost Optimization Options

**Option 1: Always Warm (Current)**
- Config: `keep_warm=1`
- Cost: ~$360/month
- Response time: Instant

**Option 2: Business Hours Only**
You can modify `modal_api.py` to use scheduled warm periods:
- Cost: ~$180/month (12 hours/day)
- Response time: Instant during hours, 10-30s cold start otherwise

**Option 3: Auto-scale (No Keep Warm)**
- Remove `keep_warm=1` from code
- Cost: Only pay per request (~$0.01/request)
- Response time: 10-30s first request, instant after

To change configuration, edit line ~103 in `modal_api.py`:
```python
keep_warm=1,  # Change to 0 for auto-scale
```

Then redeploy:
```bash
modal deploy modal_api.py
```

## 🔍 Monitoring

### View Logs
```bash
modal app logs genarabia-voice-agent
```

### Monitor Costs
Visit: https://modal.com/settings/billing

### Check Container Status
```bash
modal app status genarabia-voice-agent
```

## 🆘 Troubleshooting

### "Secret not found: huggingface-secret"
Run:
```bash
modal secret create huggingface-secret HF_TOKEN=your_token_here
```

### "HF_TOKEN not found in secrets"
The secret name must be exactly `huggingface-secret`. Check:
```bash
modal secret list
```

### "Model download fails"
- Verify HF token has access to private repos
- Check Genarabia-ai organization membership
- Ensure repos exist: `Genarabia-ai/Chatterbox_Egyptian`, etc.

### "GPU out of memory"
All 4 models loaded simultaneously requires ~20GB GPU memory. A10G has 24GB, so this should be fine. If you encounter issues:
- Try loading models on-demand instead
- Or use larger GPU: `gpu="a100-40gb"`

## 📱 Next Steps

1. ✅ Get your API endpoint URL from deployment
2. 🔜 Update frontend to use Modal endpoint
3. 🔜 Deploy frontend to Vercel
4. 🔜 Test end-to-end

See `VERCEL_DEPLOYMENT.md` for frontend deployment instructions.

## 🔄 Updating the API

To update after code changes:

```bash
modal deploy modal_api.py
```

Modal handles versioning automatically!

## 🛑 Stopping the API

To stop (and stop costs):

```bash
modal app stop genarabia-voice-agent
```

To delete completely:

```bash
modal app delete genarabia-voice-agent
```

---

**Need help?** Check Modal docs: https://modal.com/docs
