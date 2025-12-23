'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface SavedInsight {
  id: string
  content: string
  pattern_count: number
  viewed: boolean
  created_at: string
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [currentInsight, setCurrentInsight] = useState<string | null>(null)
  const [insightHistory, setInsightHistory] = useState<SavedInsight[]>([])
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)
  const [patternCount, setPatternCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      loadInsightHistory(),
      checkPatternCount()
    ])
    
    // Mark insights as viewed when page loads
    await markInsightsAsViewed()
    setLoading(false)
  }

  const checkPatternCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('patterns')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true) as any

      if (error) {
        console.error('Error checking patterns:', error)
        return
      }

      setPatternCount(data?.length || 0)
    } catch (error) {
      console.error('Error checking patterns:', error)
    }
  }

  const loadInsightHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10) as any

      if (error) {
        console.error('Error loading insight history:', error)
        return
      }

      setInsightHistory(data || [])
      
      // Show most recent insight as current
      if (data && data.length > 0) {
        setCurrentInsight(data[0].content)
      }
    } catch (error) {
      console.error('Error loading insight history:', error)
    }
  }

  const markInsightsAsViewed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mark all unviewed insights as viewed
      await (supabase as any)
        .from('insights')
        .update({ viewed: true })
        .eq('user_id', user.id)
        .eq('viewed', false)

      // Clear the has_new_patterns flag
      await (supabase as any)
        .from('users')
        .update({ has_new_patterns: false })
        .eq('id', user.id)
    } catch (error) {
      console.error('Error marking insights as viewed:', error)
    }
  }

  const handleGenerateInsight = async () => {
    if (patternCount === 0) {
      alert('No patterns found. Please go to the Patterns page and analyze your conversations first.')
      return
    }

    setGenerating(true)
    try {
      console.log('💭 Generating insight from detected patterns...')
      
      // First, get the current patterns
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: patterns } = await supabase
        .from('patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('occurrence_count', { ascending: false }) as any

      if (!patterns || patterns.length === 0) {
        alert('No patterns found. Please analyze your conversations first on the Patterns page.')
        setGenerating(false)
        return
      }

      // Generate insights
      const insightsResponse = await fetch('/api/patterns/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          patterns: patterns,
          saveToHistory: true
        })
      })
      
      const insightsData = await insightsResponse.json()
      
      if (insightsData.summary) {
        setCurrentInsight(insightsData.summary)
        await loadInsightHistory()
        
        // Set flag for new patterns
        await (supabase as any)
          .from('users')
          .update({ has_new_patterns: true })
          .eq('id', user.id)
      } else if (insightsData.error) {
        alert(`Failed to generate insight: ${insightsData.error}`)
      }
    } catch (error) {
      console.error('❌ Insight generation failed:', error)
      alert('Failed to generate insight. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading insights...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Insights
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            AI-generated synthesis connecting your patterns together
          </p>
          
          {/* Generate Button */}
          <button
            onClick={handleGenerateInsight}
            disabled={generating || patternCount === 0}
            className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating insight...
              </>
            ) : (
              <>
                ✨ Generate Insight
              </>
            )}
          </button>
          {patternCount === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              Go to <Link href="/patterns" className="text-purple-600 dark:text-purple-400 underline">Patterns</Link> and analyze your conversations first
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
              Connect {patternCount} detected pattern{patternCount !== 1 ? 's' : ''} into meaningful insights
            </p>
          )}
        </header>

        <div className="space-y-6">
          {/* Latest Insight */}
          {currentInsight && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Latest Insight
              </h2>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-6 border-2 border-amber-300 dark:border-amber-700 shadow-lg">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                      What These Patterns Reveal
                    </h3>
                    <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {currentInsight}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Previous Insights */}
          <div>
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
              Previous Insights
            </h2>
            {insightHistory.length > 0 ? (
              <div className="space-y-3">
                {insightHistory.map((insight) => {
                  const isExpanded = expandedInsight === insight.id
                  return (
                    <div
                      key={insight.id}
                      className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedInsight(isExpanded ? null : insight.id)}
                        className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(insight.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {insight.pattern_count} patterns
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          </div>
                        </div>
                        <p className={`text-sm text-slate-700 dark:text-slate-300 ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {insight.content}
                        </p>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {insight.content}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  Insights are generated from your patterns. Keep talking, and I'll share what I notice.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
