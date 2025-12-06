# Quick Integration Guide

## How to Add Flare Integration to Prediction Form

### Step 1: Import Components

At the top of `frontend/pages/influencer/create-prediction.js`, add:

```javascript
import FlareIntegration from '@/components/flare/FlareIntegration';
```

### Step 2: Add State for Supporting URL and Stake Amount

In the component's state section (around line 114), add:

```javascript
const [formData, setFormData] = useState({
  category: '',
  asset: '',
  predictionType: 'priceTarget',
  targetPrice: '',
  deadline: '',
  confidence: 3,
  reasoning: '',
  confirmed: false,
  supportingUrl: '',        // ADD THIS
  stakeAmount: '1',         // ADD THIS
});

const [ftsoPrice, setFtsoPrice] = useState(null);  // ADD THIS
const [validationResult, setValidationResult] = useState(null);  // ADD THIS
```

### Step 3: Add Flare Integration Component to Form

In the "Setup" tab (around line 872), add the Flare Integration component:

```javascript
<TabsContent value="setup" className="space-y-8 pt-4">
  {/* ... existing form fields ... */}
  
  {/* ADD THIS: Flare Integration Section */}
  {formData.category && formData.asset && (
    <div className="mt-6">
      <FlareIntegration
        assetSymbol={formData.asset.split(' ')[0]} // Extract symbol (e.g., "BTC" from "BTC - Bitcoin")
        onPriceFetched={(price, decimals, timestamp) => {
          setFtsoPrice({ price, decimals, timestamp });
        }}
        onStakeAmountChange={(amount) => {
          setFormData(prev => ({ ...prev, stakeAmount: amount }));
        }}
        stakeAmount={formData.stakeAmount}
      />
    </div>
  )}
</TabsContent>
```

### Step 4: Add Supporting URL Field in Reasoning Tab

In the "Reasoning" tab (around line 1118), add:

```javascript
<TabsContent value="reasoning" className="space-y-6">
  {/* ... existing reasoning field ... */}
  
  {/* ADD THIS: Supporting URL Field */}
  <div>
    <label className="block text-gray-700 dark:text-white mb-2 font-medium">
      Supporting URL (Optional)
    </label>
    <Input
      type="url"
      placeholder="https://example.com/article"
      value={formData.supportingUrl}
      onChange={(e) => handleChange('supportingUrl', e.target.value)}
      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    />
    <p className="text-gray-500 text-sm mt-1">
      Link to a finance article or analysis supporting your prediction
    </p>
  </div>
  
  {/* ADD THIS: Enhanced Validation Button */}
  <Button
    type="button"
    onClick={async () => {
      // Call enhanced validation API
      const response = await fetch('/api/validatePrediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionText: `${formData.asset} ${formData.predictionType === 'priceTarget' ? 'will reach ' + formData.targetPrice : 'will change by ' + formData.targetPrice} by ${formData.deadline}`,
          assetSymbol: formData.asset.split(' ')[0],
          supportingUrl: formData.supportingUrl || undefined
        })
      });
      const result = await response.json();
      setValidationResult(result);
      toast.success(`Validation Score: ${result.validationScore}/100`);
    }}
    className="bg-purple-600 hover:bg-purple-500"
  >
    Validate with AI + Web Scraping
  </Button>
  
  {/* Display validation results */}
  {validationResult && (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h4 className="text-white font-medium mb-2">AI Validation Results</h4>
      <p className="text-sm text-gray-300">
        Score: {validationResult.validationScore}/100
      </p>
      <p className="text-sm text-gray-300">
        Sentiment: {validationResult.sentimentLabel}
      </p>
      <p className="text-sm text-gray-300">
        Credibility: {validationResult.articleCredibility}/100
      </p>
    </div>
  )}
</TabsContent>
```

### Step 5: Update Submission to Include Flare Data

In the `submitToDAO` function (around line 403), update to include Flare data:

```javascript
const originalPredictionData = {
  validationScore: validationPercentage,
  sources: sources,
  perplexityCheck: reasoningValidation,
  formData: {
    // ... existing fields ...
    supportingUrl: formData.supportingUrl,  // ADD THIS
    stakeAmount: formData.stakeAmount,     // ADD THIS
  },
  flareData: {                              // ADD THIS
    ftsoPrice: ftsoPrice,
    assetSymbol: formData.asset.split(' ')[0],
  },
  aiValidation: {
    // ... existing fields ...
    // Include validationResult if available
    ...(validationResult && {
      webScrapingScore: validationResult.validationScore,
      sentiment: validationResult.sentimentLabel,
      articleCredibility: validationResult.articleCredibility
    })
  }
};
```

### Step 6: Display Flare Data in Preview

In the "Preview" tab, add:

```javascript
{ftsoPrice && (
  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
    <p className="text-sm text-purple-300">
      FTSO Price at Submission: ${ftsoPrice.price.toLocaleString()}
    </p>
  </div>
)}

{formData.stakeAmount && (
  <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
    <p className="text-sm text-orange-300">
      Staked: {formData.stakeAmount} FXRP (FAsset)
    </p>
  </div>
)}
```

---

## Quick Test Checklist

- [ ] Flare Integration component shows when asset is selected
- [ ] FTSO price displays (or shows "Fetch FTSO Price" button)
- [ ] FXRP balance shows in component
- [ ] Can approve FXRP spending
- [ ] Supporting URL field appears in Reasoning tab
- [ ] Validation API call works with URL
- [ ] Validation results display correctly
- [ ] Preview shows Flare data

---

## Notes

- The Flare Integration component handles network switching automatically
- If contract address is not set, it will use mock data for demo
- Web scraping will gracefully fail if URL is inaccessible
- All Flare features are optional - prediction can still be created without them

