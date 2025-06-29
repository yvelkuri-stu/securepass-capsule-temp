// Create: src/app/debug/env/page.tsx
'use client'

export default function EnvDebugPage() {
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
    'NODE_ENV': process.env.NODE_ENV,
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      
      <div className="space-y-4">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="border p-4 rounded">
            <div className="font-mono text-sm">
              <span className="font-bold">{key}:</span>{' '}
              {value ? (
                <span className="text-green-600">
                  {key.includes('KEY') ? 
                    `${value.substring(0, 10)}...` : 
                    value
                  }
                </span>
              ) : (
                <span className="text-red-600">undefined</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Only NEXT_PUBLIC_ variables are visible in the browser.
          If you see "undefined" for NEXT_PUBLIC_ variables in production, 
          check your Vercel environment variable configuration.
        </p>
      </div>
    </div>
  )
}