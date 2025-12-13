'use client'

interface CrisisResource {
  name: string
  contact: string
  type: 'phone' | 'text'
}

interface CountryResources {
  [country: string]: CrisisResource[]
}

const CRISIS_RESOURCES: CountryResources = {
  australia: [
    { name: 'Lifeline', contact: '13 11 14', type: 'phone' },
    { name: 'Beyond Blue', contact: '1300 22 4636', type: 'phone' },
    { name: 'Suicide Call Back Service', contact: '1300 659 467', type: 'phone' },
  ],
  'united-states': [
    { name: 'National Suicide Prevention', contact: '988', type: 'phone' },
    { name: 'Crisis Text Line', contact: 'Text HOME to 741741', type: 'text' },
    { name: 'SAMHSA Helpline', contact: '1-800-662-4357', type: 'phone' },
  ],
  'united-kingdom': [
    { name: 'Samaritans', contact: '116 123', type: 'phone' },
    { name: 'Mind', contact: '0300 123 3393', type: 'phone' },
    { name: 'CALM', contact: '0800 58 58 58', type: 'phone' },
  ],
  canada: [
    { name: 'Crisis Services Canada', contact: '988', type: 'phone' },
    { name: 'Kids Help Phone', contact: '1-800-668-6868', type: 'phone' },
  ],
  'new-zealand': [
    { name: 'Lifeline', contact: '0800 543 354', type: 'phone' },
    { name: 'Suicide Crisis', contact: '0508 828 865', type: 'phone' },
  ],
  ireland: [
    { name: 'Samaritans', contact: '116 123', type: 'phone' },
    { name: 'Pieta House', contact: '1800 247 247', type: 'phone' },
  ],
  other: [
    { name: 'International Association for Suicide Prevention', contact: 'https://www.iasp.info/resources/Crisis_Centres/', type: 'phone' },
  ],
}

interface CrisisResourcesProps {
  country?: string
  compact?: boolean
}

export default function CrisisResources({ country = 'other', compact = false }: CrisisResourcesProps) {
  const resources = CRISIS_RESOURCES[country.toLowerCase()] || CRISIS_RESOURCES.other

  if (compact) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Crisis Support Available
        </h3>
        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
          If you're in crisis, please reach out for immediate support:
        </p>
        <div className="space-y-2">
          {resources.slice(0, 2).map((resource, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium text-red-900 dark:text-red-100">{resource.name}:</span>{' '}
              <a 
                href={resource.type === 'phone' ? `tel:${resource.contact.replace(/\s/g, '')}` : resource.contact}
                className="text-red-700 dark:text-red-300 hover:underline font-semibold"
              >
                {resource.contact}
              </a>
            </div>
          ))}
        </div>
        {resources.length > 2 && (
          <p className="text-xs text-red-700 dark:text-red-300 mt-2">
            More resources available in Crisis Support
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-red-500 text-white p-6">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Crisis Support Resources
          </h1>
          <p className="text-red-50">
            You are not alone. Help is available 24/7.
          </p>
        </div>

        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            If you're experiencing a mental health crisis or having thoughts of self-harm, please reach out for immediate support. These services are confidential and available to help.
          </p>

          <div className="space-y-4">
            {resources.map((resource, idx) => (
              <div 
                key={idx} 
                className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600"
              >
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50 mb-1">
                  {resource.name}
                </h3>
                <div className="flex items-center gap-2">
                  {resource.type === 'phone' ? (
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  )}
                  <a 
                    href={resource.type === 'phone' && !resource.contact.startsWith('http') ? `tel:${resource.contact.replace(/\s/g, '')}` : resource.contact}
                    className="text-xl font-bold text-slate-900 dark:text-slate-50 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    target={resource.contact.startsWith('http') ? '_blank' : undefined}
                    rel={resource.contact.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {resource.contact}
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Emergency:</strong> If you're in immediate danger, please call emergency services (000 in Australia, 911 in US/Canada, 999 in UK, 111 in NZ).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
