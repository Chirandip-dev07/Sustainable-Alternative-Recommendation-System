export type AnalysisScores = {
  sustainability: number
  cost: number
  carbon: number
  reusability: number
}

export type Recommendation = {
  name: string
  material: string
  sustainability_score: number
  price: number
  reason: string
  alternativeType?: 'budget' | 'balanced' | 'eco'
  amazon_link?: string
  flipkart_link?: string
}

export type ScanResult = {
  detected_product: string
  category: string
  message?: string
  analysis_scores: AnalysisScores
  recommendations: Recommendation[]
}

// Convert File to Base64 data URL
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as Base64'))
      }
    }
    reader.onerror = (error) => reject(error)
  })
}

// Map the Next.js API response structure to the new UI structure and sort alternatives
function processScanResult(apiResponse: any, mode: 'eco' | 'balanced' | 'budget'): ScanResult {
  const scanData = apiResponse.data
  
  if (!scanData) {
    return {
      detected_product: 'Unknown Product',
      category: 'Unknown',
      message: apiResponse.error || 'No scan details returned.',
      analysis_scores: { sustainability: 0, cost: 0, carbon: 0, reusability: 0 },
      recommendations: [],
    }
  }

  const scores = scanData.scores || { r: 5, b: 5, c: 5 }
  
  // Calculate analysis scores (normalized to 0-100)
  // Sustainability = Reusability (r) + Biodegradability (b)
  const sustainability = Math.min(100, Math.max(0, Math.round(((scores.r + scores.b) / 20) * 100)))
  // Reusability is based on Reusability
  const reusability = Math.min(100, Math.max(0, Math.round(scores.r * 10)))
  // Carbon is based on Carbon Impact Score (c)
  // Since C is 0-10, we want to map this to an efficiency score (100 - c * 10)
  // Or display carbon score directly. The UI displays "Carbon Impact s.value%". Let's show (10 - c) * 10 as efficiency.
  const carbon = Math.min(100, Math.max(0, Math.round((10 - scores.c) * 10)))
  
  // Cost efficiency is estimated price of scanned product vs alternatives.
  // Standard default for scanned product is 65% efficiency
  const cost = 65

  // Map backend alternatives to frontend recommendations
  let recommendations: Recommendation[] = (scanData.ecoAlternatives || []).map((alt: any) => {
    // Generate a reasonable sustainability score if not provided
    let altScore = 80
    const nameLower = alt.name.toLowerCase()
    if (nameLower.includes('bamboo') || nameLower.includes('wood') || nameLower.includes('organic')) {
      altScore = 95
    } else if (nameLower.includes('steel') || nameLower.includes('metal') || nameLower.includes('copper') || nameLower.includes('iron')) {
      altScore = 90
    } else if (nameLower.includes('glass')) {
      altScore = 85
    } else if (nameLower.includes('paper') || nameLower.includes('cardboard')) {
      altScore = 75
    } else if (nameLower.includes('cloth') || nameLower.includes('cotton') || nameLower.includes('jute')) {
      altScore = 90
    }

    return {
      name: alt.name,
      material: alt.material || 'Sustainable Material',
      sustainability_score: alt.sustainabilityScore || altScore,
      price: alt.estimatedPriceINR || alt.price || 250,
      reason: alt.reason || 'An eco-friendly alternative for this product category.',
      alternativeType: alt.alternativeType || alt.type || (alt.estimatedPriceINR < 150 ? 'budget' : alt.estimatedPriceINR < 300 ? 'balanced' : 'eco'),
      amazon_link: alt.amazon_link,
      flipkart_link: alt.flipkart_link,
    }
  })

  // Sort recommendations based on the selected mode
  if (mode === 'eco') {
    recommendations.sort((a, b) => b.sustainability_score - a.sustainability_score)
  } else if (mode === 'budget') {
    recommendations.sort((a, b) => a.price - b.price)
  } else {
    // balanced: sort by combination of sustainability and price
    // We normalize price to range 0-10 (approx) and deduct from sustainability score
    recommendations.sort((a, b) => {
      const valA = a.sustainability_score - (a.price / 50)
      const valB = b.sustainability_score - (b.price / 50)
      return valB - valA
    })
  }

  return {
    detected_product: scanData.productName || 'Unknown Product',
    category: scanData.category || 'Unknown',
    message: apiResponse.error,
    analysis_scores: {
      sustainability,
      cost,
      carbon,
      reusability,
    },
    recommendations,
  }
}

export async function fetchTextRecommendations(
  query: string,
  mode: 'eco' | 'balanced' | 'budget'
): Promise<ScanResult> {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: query }),
  })

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`)
  }

  const data = await response.json()
  return processScanResult(data, mode)
}

export async function fetchImageRecommendations(
  file: File | string,
  mode: 'eco' | 'balanced' | 'budget'
): Promise<ScanResult> {
  const base64Image = typeof file === 'string' ? file : await fileToBase64(file)
  
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64Image }),
  })

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`)
  }

  const data = await response.json()
  return processScanResult(data, mode)
}
