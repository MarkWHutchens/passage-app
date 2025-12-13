import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-50">
          Passage
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300">
          Support through life's passages
        </p>
        
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          An AI companion for people navigating difficult life passages—burnout, grief, 
          divorce, addiction recovery, career crisis, and major life transitions.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/auth/signup"
            className="px-8 py-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Get Started
          </Link>
          
          <Link
            href="/auth/signin"
            className="px-8 py-4 bg-white text-slate-900 rounded-lg font-semibold border-2 border-slate-900 hover:bg-slate-50 transition-colors dark:bg-slate-800 dark:text-slate-50 dark:border-slate-50 dark:hover:bg-slate-700"
          >
            Sign In
          </Link>
        </div>

        <div className="pt-12 text-sm text-slate-500 dark:text-slate-400">
          <p className="font-semibold mb-2">Not a replacement for professional care</p>
          <p>Passage is a supportive companion, not therapy, diagnosis, or crisis intervention.</p>
        </div>
      </div>
    </div>
  )
}
