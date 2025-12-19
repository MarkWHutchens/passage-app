'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CrisisResource } from '@/types'

export default function CrisisResourcesAdmin() {
  const [resources, setResources] = useState<CrisisResource[]>([])
  const [loading, setLoading] = useState(true)
  const [editingResource, setEditingResource] = useState<CrisisResource | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    try {
      const response = await fetch('/api/admin/crisis-resources')
      if (response.ok) {
        const data = await response.json()
        setResources(data)
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (resource: CrisisResource) => {
    setEditingResource({ ...resource })
  }

  const handleSave = async () => {
    if (!editingResource) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/crisis-resources', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingResource),
      })

      if (response.ok) {
        await loadResources()
        setEditingResource(null)
      } else {
        alert('Failed to save resource')
      }
    } catch (error) {
      console.error('Error saving resource:', error)
      alert('Failed to save resource')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/admin/knowledge" className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50">
            ← Back to Admin
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Manage Crisis Resources
          </h1>
          <div className="w-32"></div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Crisis Resources by Country
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Edit crisis support resources for each country. Content is in Markdown format.
            </p>

            <div className="space-y-4">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                        {resource.country_name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Code: {resource.country_code}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEdit(resource)}
                      className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded text-sm font-mono text-slate-700 dark:text-slate-300 max-h-32 overflow-y-auto">
                    {JSON.stringify(resource.resources, null, 2).substring(0, 200)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingResource && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full my-8">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Edit Crisis Resources - {editingResource.country_name}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Country Code
                </label>
                <input
                  type="text"
                  value={editingResource.country_code}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, country_code: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Country Name
                </label>
                <input
                  type="text"
                  value={editingResource.country_name}
                  onChange={(e) =>
                    setEditingResource({ ...editingResource, country_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Resources (JSON)
                </label>
                <textarea
                  value={JSON.stringify(editingResource.resources, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      setEditingResource({ ...editingResource, resources: parsed })
                    } catch (err) {
                      // Keep the text value even if invalid JSON
                    }
                  }}
                  rows={20}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-mono text-sm"
                  placeholder='{"mental_health": [...], "young_people": [...]}'
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Edit the JSON structure carefully. Invalid JSON will not save.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingResource(null)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
