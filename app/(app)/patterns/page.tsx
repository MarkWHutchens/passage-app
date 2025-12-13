'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface DetectedPattern {
  id: string
  pattern_type: string
  description: string
  occurrence_count: number
  evidence_message_ids: string[]
  first_detected_at: string
}

interface EvidenceMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
  conversation_id: string
}

export default function PatternsPage() {
  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null)
  const [patternEvidence, setPatternEvidence] = useState<Record<string, EvidenceMessage[]>>({})
  const [loadingEvidence, setLoadingEvidence] = useState<Record<string, boolean>>({})
  const supabase = createClient()

  useEffect(() => {
    loadDetectedPatterns()
  }, [])

  const loadDetectedPatterns = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('patterns')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('occurrence_count', { ascending: false }) as any

      if (error) {
        console.error('Error loading detected patterns:', error)
        return
      }

      setDetectedPatterns(data || [])
    } catch (error) {
      console.error('Error loading detected patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeConversations = async () => {
    setAnalyzing(true)
    try {
      console.log('🔍 Detecting patterns...')
      
      const detectResponse = await fetch('/api/patterns/detect', {
        method: 'POST',
      })
      const detectData = await detectResponse.json()
      console.log('📊 Patterns detected:', detectData)
      
      if (!detectData.patterns || detectData.patterns.length === 0) {
        alert('No patterns found. Try having more conversations first!')
        setAnalyzing(false)
        return
      }
      
      // Reload patterns to show them
      await loadDetectedPatterns()
      
      alert(`Found ${detectData.patterns.length} patterns! Check the Insights page to see what they mean.`)
    } catch (error) {
      console.error('❌ Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handlePatternClick = async (pattern: DetectedPattern) => {
    const isExpanding = expandedPattern !== pattern.id

    if (isExpanding) {
      setExpandedPattern(pattern.id)
      
      // Load evidence if not already loaded
      if (!patternEvidence[pattern.id] && pattern.evidence_message_ids?.length > 0) {
        setLoadingEvidence({ ...loadingEvidence, [pattern.id]: true })
        
        try {
          const evidenceResponse = await fetch('/api/patterns/evidence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageIds: pattern.evidence_message_ids })
          })
          const evidenceData = await evidenceResponse.json()
          
          if (evidenceData.messages) {
            setPatternEvidence({ ...patternEvidence, [pattern.id]: evidenceData.messages })
          }
        } catch (error) {
          console.error('Error loading evidence:', error)
        }
        
        setLoadingEvidence({ ...loadingEvidence, [pattern.id]: false })
      }
    } else {
      setExpandedPattern(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading patterns...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 py-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Patterns
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Recurring themes, emotions, and triggers detected in your conversations
          </p>
          
          {/* Analyze Button */}
          <button
            onClick={handleAnalyzeConversations}
            disabled={analyzing}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {analyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing your conversations...
              </>
            ) : (
              <>
                🔍 Analyze My Conversations
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
            Find recurring patterns in your conversations
          </p>
        </header>

        <div className="space-y-6">
          {/* Detected Patterns */}
          {detectedPatterns.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <span>Detected Patterns</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">({detectedPatterns.length})</span>
              </h2>

              {detectedPatterns.map((pattern) => {
                const typeEmojis: Record<string, string> = {
                  recurring_theme: '🔁',
                  emotion: '💭',
                  trigger: '⚡',
                  progress: '📈'
                }
                const emoji = typeEmojis[pattern.pattern_type] || '🔍'
                const isExpanded = expandedPattern === pattern.id
                const evidence = patternEvidence[pattern.id] || []
                const isLoadingEvidence = loadingEvidence[pattern.id]
                
                return (
                  <div
                    key={pattern.id}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow border-2 border-purple-200 dark:border-purple-700 overflow-hidden"
                  >
                    <button
                      onClick={() => handlePatternClick(pattern)}
                      className="w-full p-6 text-left hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{emoji}</span>
                          <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 text-xs rounded-full capitalize">
                            {pattern.pattern_type.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(pattern.first_detected_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      
                      <p className="text-slate-900 dark:text-slate-50 font-medium mb-3">
                        {pattern.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            📊 <strong>{pattern.occurrence_count}</strong> occurrences
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            💬 <strong>{pattern.evidence_message_ids?.length || 0}</strong> conversations
                          </span>
                        </div>
                        <span className="text-sm text-purple-600 dark:text-purple-400">
                          {isExpanded ? '▼ Hide details' : '▶ View details'}
                        </span>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-4 border-t border-purple-200 dark:border-purple-700 pt-4">
                        {/* Evidence Messages */}
                        {isLoadingEvidence ? (
                          <div className="flex items-center justify-center py-4 text-slate-600 dark:text-slate-400">
                            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                            Loading evidence...
                          </div>
                        ) : evidence.length > 0 ? (
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2 text-sm flex items-center gap-2">
                              <span>📝</span>
                              Evidence from your conversations
                            </h4>
                            <div className="space-y-2">
                              {evidence.map((msg) => (
                                <Link
                                  key={msg.id}
                                  href={`/talk?conversation=${msg.conversation_id}`}
                                  className="block bg-white dark:bg-slate-800 rounded-lg p-3 hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-700"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                      msg.role === 'user'
                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    }`}>
                                      {msg.role === 'user' ? 'You' : 'Passage'}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(msg.created_at).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                    {msg.content}
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                No patterns detected yet
              </p>
              <p className="text-slate-500 dark:text-slate-500 text-sm">
                Click "Analyze My Conversations" above to find patterns in your conversations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
