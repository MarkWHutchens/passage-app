'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function JourneyPage() {
  const [activeTab, setActiveTab] = useState<'patterns' | 'insights' | 'memories'>('patterns')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Data state
  const [patterns, setPatterns] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])

  // Status tracking
  const [conversationCount, setConversationCount] = useState(0)
  const [lastAnalysisCount, setLastAnalysisCount] = useState(0)
  const [lastVisit, setLastVisit] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [lastInsightGeneration, setLastInsightGeneration] = useState<string | null>(null)
  const [lastPatternUpdate, setLastPatternUpdate] = useState<string | null>(null)
  const [generatingInsight, setGeneratingInsight] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load patterns
      const { data: patternsData } = await supabase
        .from('patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('occurrence_count', { ascending: false })

      setPatterns(patternsData || [])

      // Load insights
      const { data: insightsData } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setInsights(insightsData || [])

      // Load memories
      const { data: memoriesData } = await supabase
        .from('memory_tags')
        .select(`
          id,
          tag_type,
          custom_label,
          created_at,
          messages:message_id (id, content, role, conversation_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const flatMemories = (memoriesData || [])
        .filter((item: any) => item.messages)
        .map((item: any) => ({
          ...item.messages,
          tag_type: item.tag_type,
          custom_label: item.custom_label,
          tag_created_at: item.created_at
        }))

      setMemories(flatMemories)

      // Load tracking data
      console.log('📊 Loading tracking data for user:', user.id)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('conversation_count_at_last_analysis, last_journey_visit, last_insight_generation, last_pattern_analysis')
        .eq('id', user.id)
        .single() as any

      console.log('Profile data received:', profile)
      console.log('Profile error:', profileError)
      console.log('conversation_count_at_last_analysis value:', profile?.conversation_count_at_last_analysis)

      const analysisCount = profile?.conversation_count_at_last_analysis || 0
      console.log('Setting lastAnalysisCount to:', analysisCount)
      
      setLastAnalysisCount(analysisCount)
      setLastVisit(profile?.last_journey_visit || null)
      setLastInsightGeneration(profile?.last_insight_generation || null)
      setLastPatternUpdate(profile?.last_pattern_analysis || null)

      // Get current conversation count
      const { count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id) as any

      setConversationCount(count || 0)

      // Update last visit
      await (supabase
        .from('users')
        .update({ last_journey_visit: new Date().toISOString() } as any)
        .eq('id', user.id) as any)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function isNew(date: string) {
    if (!lastVisit) return false
    return new Date(date) > new Date(lastVisit)
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    try {
      await fetch('/api/patterns/detect', { method: 'POST' })
      
      // Reload data to get new patterns and updated tracking
      setLoading(true)
      await loadData()
      
      alert('Analysis complete! Check the patterns above.')
    } catch (error) {
      alert('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleGenerateInsight() {
    if (patterns.length === 0) {
      alert('No patterns detected yet. Run pattern analysis first.')
      return
    }

    setGeneratingInsight(true)
    try {
      const response = await fetch('/api/patterns/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          patterns: patterns,
          saveToHistory: true 
        })
      })

      if (response.ok) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Update last_insight_generation timestamp
          await (supabase
            .from('users')
            .update({ last_insight_generation: new Date().toISOString() } as any)
            .eq('id', user.id) as any)
        }

        // Reload data
        setLoading(true)
        await loadData()
        
        alert('Insight generated! Check the Insights tab.')
      } else {
        alert('Failed to generate insight')
      }
    } catch (error) {
      console.error('Error generating insight:', error)
      alert('Failed to generate insight')
    } finally {
      setGeneratingInsight(false)
    }
  }

  function getTimeAgo(dateString: string | null): string {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  function needsNewInsight(): boolean {
    // No patterns yet
    if (patterns.length === 0) return false
    
    // Never generated an insight
    if (!lastInsightGeneration) return true
    
    // Patterns updated after last insight
    if (lastPatternUpdate && new Date(lastPatternUpdate) > new Date(lastInsightGeneration)) {
      return true
    }
    
    // Insight older than 7 days
    const daysSinceInsight = (new Date().getTime() - new Date(lastInsightGeneration).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceInsight > 7) return true
    
    return false
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  const newConversations = conversationCount - lastAnalysisCount

  return (
    <div className="min-h-screen p-4 pb-24 relative">
      {/* Loading Overlay */}
      {analyzing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="animate-spin h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full"></div>
              <span className="font-semibold text-slate-900 dark:text-slate-50">Analyzing Patterns...</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This may take 10-30 seconds. Please wait.
            </p>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Your Journey
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Track your progress, patterns, and insights
          </p>
        </header>

        {/* Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-6">
          <div className="grid grid-cols-3 gap-1">
            {['patterns', 'insights', 'memories'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-50 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'patterns' && (
            <div className="space-y-4">
              {/* Status Bar */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Covering {lastAnalysisCount} of {conversationCount} conversations
                </span>
                {newConversations === 0 ? (
                  <span className="text-green-600 font-medium">✓ All caught up</span>
                ) : (
                  <button
                    onClick={handleAnalyze}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700"
                  >
                    Analyze {newConversations} new
                  </button>
                )}
              </div>

              {/* Patterns List */}
              {patterns.length > 0 ? (
                <div className="space-y-3">
                  {patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="bg-white dark:bg-slate-800 rounded-lg shadow p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium capitalize">
                          {pattern.pattern_type?.replace('_', ' ')}
                        </span>
                        {isNew(pattern.first_detected_at) && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-slate-900 dark:text-slate-50 text-sm">
                        {pattern.description}
                      </p>
                      <div className="mt-2 text-xs text-slate-500">
                        {pattern.occurrence_count}x occurrences
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    No patterns detected yet
                  </p>
                  <button
                    onClick={handleAnalyze}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    Analyze Conversations
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-4">
              {/* Status Bar */}
              {patterns.length > 0 && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                  {lastInsightGeneration ? (
                    <>
                      <span className="text-slate-600 dark:text-slate-400">
                        Last insight: {getTimeAgo(lastInsightGeneration)} • Based on {patterns.length} pattern{patterns.length > 1 ? 's' : ''}
                      </span>
                      {needsNewInsight() ? (
                        <button
                          onClick={handleGenerateInsight}
                          disabled={generatingInsight}
                          className="px-3 py-1 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                        >
                          {generatingInsight ? 'Generating...' : 'Generate insight'}
                        </button>
                      ) : (
                        <span className="text-green-600 font-medium">✓ Up to date</span>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-slate-600 dark:text-slate-400">
                        {patterns.length} pattern{patterns.length > 1 ? 's' : ''} detected
                      </span>
                      <button
                        onClick={handleGenerateInsight}
                        disabled={generatingInsight}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 disabled:opacity-50"
                      >
                        {generatingInsight ? 'Generating...' : 'Generate your first insight'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {insights.length > 0 ? (
                insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow p-6"
                  >
                    {isNew(insight.created_at) && (
                      <span className="inline-block text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full mb-2">
                        New
                      </span>
                    )}
                    <p className="text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
                      {insight.content}
                    </p>
                    <div className="mt-3 text-xs text-slate-500">
                      {new Date(insight.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    No insights yet. Patterns are analyzed first.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'memories' && (
            <div className="space-y-4">
              {memories.length > 0 ? (
                memories.map((memory) => (
                  <Link
                    key={memory.id}
                    href={`/talk?conversation=${memory.conversation_id}`}
                    className="block bg-white dark:bg-slate-800 rounded-lg shadow p-4 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-blue-600 dark:text-blue-400 capitalize">
                        {memory.tag_type?.replace('_', ' ')}
                      </span>
                      {isNew(memory.tag_created_at) && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-slate-900 dark:text-slate-50 text-sm line-clamp-2">
                      {memory.content}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    No tagged memories yet
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
