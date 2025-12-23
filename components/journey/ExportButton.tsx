'use client'

import { useState, useRef, useEffect } from 'react'
import jsPDF from 'jspdf'

interface ExportButtonProps {
  data: any[]
  filename: string
  title: string
}

export default function ExportButton({ data, filename, title }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false)
  const [customFromDate, setCustomFromDate] = useState('')
  const [customToDate, setCustomToDate] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get last export date from localStorage
  const getLastExportDate = (): Date | null => {
    const stored = localStorage.getItem(`lastExport_${filename}`)
    return stored ? new Date(stored) : null
  }

  const setLastExportDate = () => {
    localStorage.setItem(`lastExport_${filename}`, new Date().toISOString())
  }

  const lastExportDate = getLastExportDate()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowCustomDatePicker(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Detect date field in data
  const getDateField = (item: any): Date | null => {
    const dateFields = ['created_at', 'taggedAt', 'tag_created_at', 'first_detected_at', 'last_seen_at']
    for (const field of dateFields) {
      if (item[field]) {
        return new Date(item[field])
      }
    }
    return null
  }

  // Filter data by date range
  const filterDataByDateRange = (fromDate: Date | null, toDate: Date | null): any[] => {
    if (!fromDate && !toDate) return data

    return data.filter(item => {
      const itemDate = getDateField(item)
      if (!itemDate) return true // Include items without dates

      if (fromDate && itemDate < fromDate) return false
      if (toDate) {
        const endOfDay = new Date(toDate)
        endOfDay.setHours(23, 59, 59, 999)
        if (itemDate > endOfDay) return false
      }
      return true
    })
  }

  const downloadJSON = () => {
    const exportData = {
      title,
      exportDate: new Date().toISOString(),
      itemCount: data.length,
      items: data
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setIsOpen(false)
  }

  const generatePDFBlob = (dateRangeText: string = '', filteredData?: any[]): Blob => {
    const dataToExport = filteredData || data
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    let yPos = margin

    // Format date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })

    // Title with date range
    const fullTitle = dateRangeText ? `${title} - ${dateRangeText}` : title
    pdf.setFontSize(18)
    pdf.setFont('helvetica', 'bold')
    const titleLines = pdf.splitTextToSize(fullTitle, maxWidth)
    titleLines.forEach((line: string) => {
      pdf.text(line, margin, yPos)
      yPos += 8
    })
    yPos += 2

    // Export date
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100)
    pdf.text(`Exported: ${date}`, margin, yPos)
    yPos += 6
    pdf.text(`Total Items: ${dataToExport.length}`, margin, yPos)
    yPos += 12

    // Reset color
    pdf.setTextColor(0)
    pdf.setFontSize(11)

    // Add items
    dataToExport.forEach((item, index) => {
      // Check if we need a new page
      if (yPos > pageHeight - 40) {
        pdf.addPage()
        yPos = margin
      }

      // Item number
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${index + 1}.`, margin, yPos)
      yPos += 6

      // Item content
      pdf.setFont('helvetica', 'normal')
      
      if (item.description) {
        const lines = pdf.splitTextToSize(item.description, maxWidth - 10)
        lines.forEach((line: string) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage()
            yPos = margin
          }
          pdf.text(line, margin + 5, yPos)
          yPos += 5
        })
        
        if (item.occurrence_count) {
          pdf.setFontSize(9)
          pdf.setTextColor(100)
          pdf.text(`Occurrences: ${item.occurrence_count}`, margin + 5, yPos)
          yPos += 5
        }
        if (item.pattern_type) {
          pdf.text(`Type: ${item.pattern_type}`, margin + 5, yPos)
          yPos += 5
        }
        pdf.setFontSize(11)
        pdf.setTextColor(0)
      } else if (item.content) {
        const lines = pdf.splitTextToSize(item.content, maxWidth - 10)
        lines.forEach((line: string) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage()
            yPos = margin
          }
          pdf.text(line, margin + 5, yPos)
          yPos += 5
        })
        
        const itemDate = getDateField(item)
        if (itemDate) {
          const itemDateStr = itemDate.toLocaleDateString()
          pdf.setFontSize(9)
          pdf.setTextColor(100)
          pdf.text(`Date: ${itemDateStr}`, margin + 5, yPos)
          pdf.setFontSize(11)
          pdf.setTextColor(0)
          yPos += 5
        }
      }
      
      yPos += 8 // Spacing between items
    })

    // Return blob instead of saving
    return pdf.output('blob')
  }

  const downloadPDF = (dateRangeText: string = '', filteredData?: any[]) => {
    const pdfBlob = generatePDFBlob(dateRangeText, filteredData)
    const url = URL.createObjectURL(pdfBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setLastExportDate()
    setIsOpen(false)
  }

  const sharePDF = async (dateRangeText: string = '', filteredData?: any[]) => {
    try {
      const pdfBlob = generatePDFBlob(dateRangeText, filteredData)
      const pdfFileName = `${filename}.pdf`
      const file = new File([pdfBlob], pdfFileName, { type: 'application/pdf' })

      // Check if Web Share API is supported and can share files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: 'Sharing from Passage',
        })
        setLastExportDate()
        setIsOpen(false)
      } else {
        // Fallback to download
        downloadPDF(dateRangeText, filteredData)
      }
    } catch (error: any) {
      // User cancelled share or error occurred
      if (error.name === 'AbortError') {
        console.log('Share cancelled')
      } else {
        console.error('Share failed:', error)
        // Fallback to download on error
        downloadPDF(dateRangeText, filteredData)
      }
    }
  }

  const handleDateRangeExport = (rangeType: string) => {
    const now = new Date()
    let fromDate: Date | null = null
    let toDate: Date | null = now
    let rangeText = ''

    switch (rangeType) {
      case 'all':
        fromDate = null
        toDate = null
        rangeText = 'All Time'
        break
      case '30days':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        rangeText = 'Last 30 Days'
        break
      case '90days':
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        rangeText = 'Last 90 Days'
        break
      case 'since-last':
        if (lastExportDate) {
          fromDate = lastExportDate
          rangeText = `Since ${lastExportDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        }
        break
    }

    const filteredData = filterDataByDateRange(fromDate, toDate)
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const fullRangeText = rangeText ? `${rangeText} - ${dateStr}` : dateStr
    downloadPDF(fullRangeText, filteredData)
  }

  const handleCustomRangeExport = () => {
    if (!customFromDate && !customToDate) {
      alert('Please select at least one date')
      return
    }

    const fromDate = customFromDate ? new Date(customFromDate) : null
    const toDate = customToDate ? new Date(customToDate) : null

    const filteredData = filterDataByDateRange(fromDate, toDate)
    
    let rangeText = ''
    if (fromDate && toDate) {
      rangeText = `${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else if (fromDate) {
      rangeText = `Since ${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else if (toDate) {
      rangeText = `Until ${toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }

    downloadPDF(rangeText, filteredData)
    setShowCustomDatePicker(false)
    setCustomFromDate('')
    setCustomToDate('')
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
        title="Export"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
          {!showCustomDatePicker ? (
            <>
              <button
                onClick={() => handleDateRangeExport('all')}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                All time
              </button>
              <button
                onClick={() => handleDateRangeExport('30days')}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Last 30 days
              </button>
              <button
                onClick={() => handleDateRangeExport('90days')}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Last 90 days
              </button>
              {lastExportDate && (
                <button
                  onClick={() => handleDateRangeExport('since-last')}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Since {lastExportDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </button>
              )}
              <button
                onClick={() => setShowCustomDatePicker(true)}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Custom range...
              </button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
              <button
                onClick={() => downloadPDF('', data)}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Download PDF
              </button>
              <button
                onClick={() => sharePDF('', data)}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Share PDF...
              </button>
              <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
              <button
                onClick={downloadJSON}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Download Backup (JSON)
              </button>
            </>
          ) : (
            <div className="p-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  From:
                </label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To:
                </label>
                <input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCustomRangeExport}
                  className="flex-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Export
                </button>
                <button
                  onClick={() => {
                    setShowCustomDatePicker(false)
                    setCustomFromDate('')
                    setCustomToDate('')
                  }}
                  className="flex-1 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
