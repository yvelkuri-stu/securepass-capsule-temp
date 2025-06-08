
// 📁 src/app/debug/page.tsx (Temporary debug page)
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DebugService } from '@/lib/debug'

export default function DebugPage() {
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebugChecks = async () => {
    setIsLoading(true)
    try {
      const results = await DebugService.runAllChecks()
      setResults(results)
    } catch (error) {
      console.error('Debug error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Debug Console</CardTitle>
          <CardDescription>
            Check database connection, tables, and test operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDebugChecks} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Running Checks...' : 'Run Debug Checks'}
          </Button>

          {results && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded ${results.connection ? 'bg-green-100' : 'bg-red-100'}`}>
                  <strong>Database Connection:</strong>
                  <br />
                  {results.connection ? '✅ Connected' : '❌ Failed'}
                </div>
                
                <div className={`p-3 rounded ${results.user ? 'bg-green-100' : 'bg-red-100'}`}>
                  <strong>User Authentication:</strong>
                  <br />
                  {results.user ? '✅ Authenticated' : '❌ Not authenticated'}
                </div>
                
                <div className={`p-3 rounded ${results.capsuleTest ? 'bg-green-100' : 'bg-red-100'}`}>
                  <strong>Capsule Operations:</strong>
                  <br />
                  {results.capsuleTest ? '✅ Working' : '❌ Failed'}
                </div>
                
                <div className="p-3 rounded bg-blue-100">
                  <strong>Tables Status:</strong>
                  <br />
                  {Object.entries(results.tables).map(([table, status]) => (
                    <div key={table}>
                      {status ? '✅' : '❌'} {table}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded">
                <strong>Check browser console for detailed logs</strong>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}