import { createFileRoute } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { 
  Upload, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Sparkles, 
  Trash2, 
  FileText, 
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { API_BASE, apiFetch, friendlyError } from '../lib/api'

export const Route = createFileRoute('/cv-analyst')({
  component: CvAnalystComponent,
})

interface CVAnalysisResult {
  atsScore: number
  strengths: string[]
  improvements: string[]
  missingElements: string[]
  otherFeedback: string
}

export function CvAnalystComponent() {
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [result, setResult] = useState<CVAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [jobDescription, setJobDescription] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        } else {
          reject(new Error('Failed to read file as data URL'))
        }
      }
      reader.onerror = (err) => reject(err)
    })
  }

  const analyzeCVFile = async (selectedFile: File) => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please upload a smaller file.')
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const base64Data = await fileToBase64(selectedFile)
      
      const payload = {
        fileBase64: base64Data,
        mimeType: selectedFile.type || 'application/octet-stream',
        fileName: selectedFile.name,
        jobDescription: jobDescription.trim() || undefined,
      }

      const response = await apiFetch<CVAnalysisResult>(`${API_BASE}/ai/analyze-cv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      setResult(response)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0]
      setFile(selected)
      analyzeCVFile(selected)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0]
      setFile(selected)
      analyzeCVFile(selected)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const clearAnalysis = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Panel */}
      <div className="border-b border-choco-100 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-semibold text-choco-400">AI Intelligence Module</span>
          <h2 className="text-3xl font-serif font-bold text-choco-900 mt-1">CV Feedback & Analyst</h2>
          <p className="text-choco-600 mt-2 text-sm max-w-xl">
            Upload your CV or Resume to receive immediate feedback on improvements, strengths, missing details, and general suggestions.
          </p>
        </div>

        {/* Privacy Banner */}
        <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl p-3 text-green-800 text-xs max-w-xs shadow-xs">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Privacy-First Policy</span>
            We process your resume in-memory and send it directly to Gemini. No files are saved to our servers or databases.
          </div>
        </div>
      </div>

      {error && !file && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-red-800 text-sm">Upload Error</h5>
            <p className="text-red-700 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Job Description Optional Input */}
      {!file && (
        <div className="bg-white border border-choco-100 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="job-description-input" className="text-sm font-serif font-bold text-choco-800 flex items-center gap-1.5">
              <span>Target Job Description (Optional)</span>
            </label>
            <span className="text-[10px] text-choco-400 font-semibold uppercase tracking-wider">Compare Suitability</span>
          </div>
          <textarea
            id="job-description-input"
            rows={4}
            className="w-full text-sm p-3 bg-cream-50/50 border border-choco-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-choco-400 focus:border-choco-400 placeholder-choco-300 transition-all font-sans text-choco-800 resize-none"
            placeholder="Paste the job description here to compare how well your CV matches the specific requirements..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>
      )}

      {/* Main Control Area */}
      {!file ? (
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[320px] bg-white
            ${dragActive 
              ? 'border-choco-500 bg-cream-100/50 scale-[0.99] shadow-inner' 
              : 'border-choco-200 hover:border-choco-400 hover:shadow-xs'
            }`}
          onClick={triggerFileInput}
        >
          <input 
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={handleChange}
            data-testid="cv-upload-input"
          />

          <div className="w-16 h-16 rounded-full bg-cream-100/80 flex items-center justify-center text-choco-600 mb-4 transition-transform hover:scale-110">
            <Upload className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-serif font-semibold text-choco-800">Upload your CV/Resume</h3>
          <p className="text-choco-500 text-sm mt-1 max-w-sm">
            Drag and drop your file here, or click to browse.
          </p>
          <div className="mt-4 flex flex-col items-center gap-1 text-xs font-semibold text-choco-400 uppercase tracking-wider">
            <span>PDF or Plain Text</span>
            <span className="text-[10px] text-choco-300 font-sans">Max size: 5MB</span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-choco-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-choco-50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center text-choco-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-choco-800 text-sm md:text-base truncate max-w-[200px] md:max-w-md">{file.name}</h4>
                <p className="text-xs text-choco-400">{(file.size / 1024).toFixed(1)} KB • Live Session</p>
              </div>
            </div>

            <button 
              onClick={clearAnalysis}
              disabled={analyzing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-choco-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors text-xs font-semibold text-choco-600 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear File</span>
            </button>
          </div>

          {analyzing && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-choco-600 animate-spin" />
              <h4 className="font-serif font-semibold text-choco-800">Analyzing your CV...</h4>
              <p className="text-choco-400 text-xs">Gemini AI is scanning your resume structure, strengths, and gaps.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-red-800 text-sm">Analysis Failed</h5>
                <p className="text-red-700 text-xs mt-1">{error}</p>
                <button 
                  onClick={() => analyzeCVFile(file)}
                  className="mt-3 text-xs font-bold text-red-900 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Retry Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Output Presentation */}
      {result && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main detailed blocks */}
          <div className="md:col-span-8 space-y-8">
            {/* Strengths Card */}
            <div className="bg-white border border-choco-100 rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-choco-900">What Good (Strengths)</h3>
              </div>
              <ul className="space-y-3">
                {result.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-choco-700">
                    <span className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center text-green-600 text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements Card */}
            <div className="bg-white border border-choco-100 rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-choco-900">What to Improve</h3>
              </div>
              <ul className="space-y-3">
                {result.improvements.map((imp, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-choco-700">
                    <span className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Elements to Add Card */}
            <div className="bg-white border border-choco-100 rounded-2xl p-6 md:p-8 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-choco-500" />
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-choco-50 flex items-center justify-center text-choco-700">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-choco-900">What to Add (Gaps)</h3>
              </div>
              <ul className="space-y-3">
                {result.missingElements.map((add, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-choco-700">
                    <span className="w-5 h-5 rounded-full bg-choco-50 flex items-center justify-center text-choco-600 text-xs font-bold shrink-0 mt-0.5">
                      +
                    </span>
                    <span>{add}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right sidebar feedback summary */}
          <div className="md:col-span-4 space-y-6">
            {/* ATS Score Card */}
            <div className="bg-white border border-choco-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
              <h4 className="font-serif font-bold text-choco-800 mb-4">ATS Compatibility Score</h4>
              <div className="relative w-32 h-32 flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    className="stroke-cream-100 fill-transparent"
                    strokeWidth="10"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="50"
                    className={`fill-transparent transition-all duration-500 ${
                      result.atsScore >= 80 
                        ? 'stroke-green-500' 
                        : result.atsScore >= 50 
                          ? 'stroke-amber-500' 
                          : 'stroke-red-500'
                    }`}
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 50}
                    strokeDashoffset={2 * Math.PI * 50 - (result.atsScore / 100) * (2 * Math.PI * 50)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className={`text-3xl font-bold font-sans ${
                    result.atsScore >= 80 
                      ? 'text-green-600' 
                      : result.atsScore >= 50 
                        ? 'text-amber-600' 
                        : 'text-red-600'
                  }`}>
                    {result.atsScore}%
                  </span>
                  <span className="text-[10px] text-choco-400 font-semibold uppercase tracking-wider mt-0.5">
                    {result.atsScore >= 80 
                      ? 'Excellent' 
                      : result.atsScore >= 50 
                        ? 'Good Match' 
                        : 'Poor Match'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-choco-500 mt-4 leading-relaxed max-w-[220px]">
                {result.atsScore >= 80 
                  ? 'Your CV matches modern parser requirements perfectly! Ready to send.' 
                  : result.atsScore >= 50 
                    ? 'Some minor improvements are required to pass automated recruiter screenings.' 
                    : 'Critical errors or layout formatting issue detected. Needs significant revisions.'}
              </p>
            </div>

            {jobDescription.trim() && (
              <div className="bg-cream-100/30 border border-choco-100/60 rounded-2xl p-5 space-y-2 text-xs text-choco-700">
                <span className="font-bold text-choco-800 block font-serif">Comparison Job Desk:</span>
                <p className="italic line-clamp-4 leading-relaxed font-sans">"{jobDescription}"</p>
              </div>
            )}

            <div className="bg-cream-100/40 border border-choco-100/80 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-choco-700" />
                <h4 className="font-serif font-bold text-choco-800">Overall Advice</h4>
              </div>
              <p className="text-sm text-choco-700 leading-relaxed font-sans whitespace-pre-line">
                {result.otherFeedback}
              </p>
            </div>
            
            <div className="bg-white border border-choco-100 rounded-2xl p-5 text-center text-xs text-choco-400 font-semibold tracking-wide uppercase">
              Live feedback report • Privacy Shield Active
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
