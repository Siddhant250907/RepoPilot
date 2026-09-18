import { useState, useRef, useEffect } from 'react';
import { debugCodeSnippet, CodeDebugResult } from '../services/api';
import TiltCard from './TiltCard';
import TechnicalSurface from './TechnicalSurface';

export interface CodePreset {
  name: string;
  lang: string;
  code: string;
  error?: string;
  context?: string;
}

const SAMPLE_PRESETS: CodePreset[] = [
  {
    name: 'Python (Calc Bug)',
    lang: 'python',
    code: `def calculate_discount(price: float, discount_percent: float) -> float:
    """Calculate discounted price with percentage off."""
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    
    # Bug: Off-by-one addition (+ 5.0) causes test failure
    discount_amount = price * (discount_percent / 100.0)
    return round(price - discount_amount + 5.0, 2)

def add(a: float, b: float) -> float:
    # Bug: Subtraction instead of addition
    return a - b`,
    error: 'FAILED test_calculate_discount: assert 85.0 == 80.0\nFAILED test_add: assert -1 == 5',
    context: 'A $100 item with 20% discount should cost $80.00. add(2, 3) must return 5.',
  },
  {
    name: 'JavaScript (Async Race)',
    lang: 'javascript',
    code: `async function fetchUserData(userIds) {
    const results = [];
    // Bug: forEach does not await async callback, returns empty results immediately
    userIds.forEach(async (id) => {
        const user = await api.getUser(id);
        results.push(user);
    });
    return results;
}`,
    error: 'AssertionError: Expected array with 3 users, but received empty array []',
    context: 'Fetch details for multiple users concurrently and return all results in order.',
  },
  {
    name: 'TypeScript (Unsafe Any / Null)',
    lang: 'typescript',
    code: `interface UserProfile {
    id: string;
    settings?: {
        theme?: string;
        notifications?: {
            email: boolean;
        };
    };
}

function getEmailNotificationStatus(user: UserProfile): boolean {
    // Bug: TypeError: Cannot read properties of undefined (reading 'notifications')
    return user.settings.notifications.email;
}`,
    error: "TypeError: Cannot read properties of undefined (reading 'notifications')",
    context: 'Safely access nested settings with defaults if user settings are undefined.',
  },
  {
    name: 'C++ (Null Deref)',
    lang: 'cpp',
    code: `#include <iostream>
#include <string>

struct Session {
    std::string token;
    int expires_in;
};

void printSessionToken(Session* session) {
    // Bug: No null check before dereference leads to Segmentation fault
    std::cout << "Token: " << session->token << std::endl;
}

int main() {
    Session* current_session = nullptr;
    printSessionToken(current_session);
    return 0;
}`,
    error: 'Segmentation fault (core dumped) at 0x00000000',
    context: 'Prevent segmentation fault when session pointer is null.',
  },
  {
    name: 'Go (Goroutine Deadlock)',
    lang: 'go',
    code: `package main

import "fmt"

func processNumbers(numbers []int) int {
    ch := make(chan int) // Bug: Unbuffered channel causes deadlock without sender goroutine
    sum := 0
    for _, n := range numbers {
        ch <- n
    }
    close(ch)
    for v := range ch {
        sum += v
    }
    return sum
}`,
    error: 'fatal error: all goroutines are asleep - deadlock!',
    context: 'Sum integers concurrently or use a buffered channel / separate goroutine.',
  },
  {
    name: 'Java (NullPointer / Loop)',
    lang: 'java',
    code: `import java.util.List;

public class UserManager {
    public static int getActiveUserCount(List<String> users) {
        int count = 0;
        // Bug: users can be null, and off-by-one <= throws IndexOutOfBoundsException
        for (int i = 0; i <= users.size(); i++) {
            if (users.get(i).equalsIgnoreCase("active")) {
                count++;
            }
        }
        return count;
    }
}`,
    error: 'java.lang.IndexOutOfBoundsException: Index 3 out of bounds for length 3',
    context: 'Safely count active users and avoid index out of bounds exception.',
  },
  {
    name: 'Rust (Borrow Checker)',
    lang: 'rust',
    code: `fn main() {
    let mut names = vec!["Alice", "Bob", "Charlie"];
    
    // Bug: Cannot borrow names as mutable while also holding immutable iterator
    for name in &names {
        if *name == "Bob" {
            names.push("Robert");
        }
    }
    println!("{:?}", names);
}`,
    error: "error[E0499]: cannot borrow `names` as mutable more than once at a time",
    context: 'Modify collection safely without violating Rust borrow checker rules.',
  },
];

const LANGUAGES = [
  { id: 'auto', name: 'Auto Detect' },
  { id: 'python', name: 'Python' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'cpp', name: 'C / C++' },
  { id: 'go', name: 'Go' },
  { id: 'java', name: 'Java' },
  { id: 'rust', name: 'Rust' },
  { id: 'csharp', name: 'C#' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Bash / Shell' },
];

export default function CodeDebuggerStudio({
  onApplyToWorkspace,
}: {
  onApplyToWorkspace?: (code: string, lang: string) => void;
}) {
  const [code, setCode] = useState<string>(SAMPLE_PRESETS[0].code);
  const [language, setLanguage] = useState<string>('python');
  const [errorMessage, setErrorMessage] = useState<string>(SAMPLE_PRESETS[0].error || '');
  const [context, setContext] = useState<string>(SAMPLE_PRESETS[0].context || '');
  const [showTracebackBox, setShowTracebackBox] = useState<boolean>(true);

  const [isDebugging, setIsDebugging] = useState<boolean>(false);
  const [debugResult, setDebugResult] = useState<CodeDebugResult | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'clean' | 'diff' | 'analysis'>('clean');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedOriginal, setCopiedOriginal] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Keyboard shortcut: Cmd+Enter or Ctrl+Enter to trigger debug
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleDebug();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language, errorMessage, context, isDebugging]);

  const handleSelectPreset = (preset: CodePreset) => {
    setCode(preset.code);
    setLanguage(preset.lang);
    setErrorMessage(preset.error || '');
    setContext(preset.context || '');
    setDebugResult(null);
    setDebugError(null);
  };

  const handleDebug = async () => {
    if (!code.trim()) return;
    setIsDebugging(true);
    setDebugError(null);

    try {
      const result = await debugCodeSnippet({
        code,
        language: language === 'auto' ? undefined : language,
        error_message: errorMessage.trim() || undefined,
        context: context.trim() || undefined,
      });
      setDebugResult(result);
      setActiveResultTab('clean');
    } catch (err: any) {
      setDebugError(err?.message || 'Failed to debug code. Please check backend connection.');
    } finally {
      setIsDebugging(false);
    }
  };

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(text);
      }
    } catch (err) {
      console.error('Clipboard permission denied', err);
    }
  };

  // Compute line count for gutter
  const lineCount = Math.max(1, code.split('\n').length);
  const resultLineCount = debugResult ? Math.max(1, debugResult.debugged_code.split('\n').length) : 0;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card rounded-3xl p-6 border border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3] animate-ping" />
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Universal Code Debugger</span>
              <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/20 border border-[#0071E3]/30 text-[10px] mono font-semibold text-[#64B5F6]">
                ANY LANGUAGE
              </span>
            </h1>
          </div>
          <p className="text-xs text-[#86868B] max-w-2xl">
            Paste error code from Python, JavaScript, TypeScript, C++, Go, Rust, Java, SQL, or Shell.
            RepoPilot automatically detects flaws, identifies root causes, and returns clean, working code.
          </p>
        </div>

        {/* Quick Language Selector */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <label className="text-[11px] mono text-[#86868B] font-semibold">Language:</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="glass rounded-xl px-3.5 py-2 text-xs font-semibold text-white bg-black/50 border border-white/15 focus:outline-none focus:border-[#0071E3] transition-all cursor-pointer"
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id} className="bg-[#1C1C1E] text-white">
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] mono text-[#86868B] font-semibold uppercase tracking-wider mr-1">
          Quick Presets:
        </span>
        {SAMPLE_PRESETS.map(preset => {
          const isSelected = preset.code === code;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelectPreset(preset)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all duration-150 cursor-pointer font-medium border ${
                isSelected
                  ? 'bg-white/20 text-white border-white/30 shadow-sm'
                  : 'bg-white/[0.04] text-[#A1A1A6] border-white/10 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Main Dual-Pane Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Pane: Error Code Input */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col">
            {/* Editor Toolbar */}
            <div className="px-4 py-3 bg-black/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80" />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Input Buggy Code</span>
                <span className="text-[10px] mono text-[#86868B] px-2 py-0.5 rounded bg-white/5">
                  {lineCount} lines • {code.length} chars
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#F5F5F7] border border-white/10 transition-colors cursor-pointer"
                  title="Paste from clipboard"
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCode('');
                    setErrorMessage('');
                    setContext('');
                    setDebugResult(null);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[#86868B] hover:text-[#FF453A] border border-white/10 transition-colors cursor-pointer"
                  title="Clear editor"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Code Textarea with Line Numbers */}
            <div className="relative flex bg-[#0A0A0C] min-h-[320px] max-h-[460px] overflow-hidden">
              {/* Line Numbers */}
              <div className="select-none py-3 px-3 text-right mono text-[11px] text-[#48484A] bg-[#070709] border-r border-white/5 shrink-0">
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i} className="leading-5">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="// Paste buggy source code here..."
                spellCheck={false}
                className="w-full flex-1 p-3 bg-transparent text-white font-mono text-[12px] leading-5 resize-none focus:outline-none placeholder:text-white/20 selection:bg-[#0071E3]/40 overflow-y-auto"
                style={{ tabSize: 4 }}
              />
            </div>

            {/* Collapsible Error / Traceback Section */}
            <div className="border-t border-white/10 p-4 bg-black/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowTracebackBox(!showTracebackBox)}
                  className="text-xs font-semibold text-[#86868B] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>{showTracebackBox ? '▼' : '▶'}</span>
                  <span>Compiler Output / Traceback (Optional)</span>
                </button>
                {errorMessage && (
                  <span className="text-[10px] mono text-[#FF9500] font-semibold">Error Log Attached</span>
                )}
              </div>

              {showTracebackBox && (
                <div className="flex flex-col gap-2.5">
                  <textarea
                    value={errorMessage}
                    onChange={e => setErrorMessage(e.target.value)}
                    placeholder="Paste terminal compiler error, runtime exception, or test failure..."
                    rows={3}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono text-[11px] placeholder:text-white/20 focus:outline-none focus:border-[#FF9500]/50"
                  />
                  <input
                    type="text"
                    value={context}
                    onChange={e => setContext(e.target.value)}
                    placeholder="Context / Intended behavior (e.g. 'Must handle null values safely')"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-[#0071E3]/50"
                  />
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between">
              <div className="text-[11px] mono text-[#86868B] hidden sm:block">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">⌘ + ↵</kbd> to debug
              </div>

              <button
                type="button"
                onClick={handleDebug}
                disabled={isDebugging || !code.trim()}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer shadow-lg ml-auto ${
                  isDebugging || !code.trim()
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-[#0071E3] hover:bg-[#0077ED] text-white hover:scale-[1.02] shadow-[#0071E3]/25'
                }`}
              >
                {isDebugging ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing & Debugging...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                    <span>Debug & Fix Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Debugged Code & Analysis */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
            {/* Header Tabs */}
            <div className="px-4 py-3 bg-black/40 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'clean' as const, label: 'Debugged Code' },
                  { id: 'diff' as const, label: 'Visual Diff' },
                  { id: 'analysis' as const, label: 'Diagnosis & Fixes' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveResultTab(tab.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                      activeResultTab === tab.id
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-[#86868B] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {debugResult && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] mono px-2 py-0.5 rounded-full bg-[#30D158]/20 border border-[#30D158]/30 text-[#30D158] font-bold">
                    ✓ {debugResult.detected_language}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(debugResult.debugged_code)}
                    className={`text-xs px-3 py-1 rounded-lg transition-all duration-150 cursor-pointer font-semibold flex items-center gap-1.5 ${
                      copied
                        ? 'bg-[#30D158] text-black font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {copied ? '✓ Copied!' : 'Copy Code'}
                  </button>
                </div>
              )}
            </div>

            {/* Error Message if any */}
            {debugError && (
              <div className="p-4 m-4 rounded-xl bg-[#FF453A]/15 border border-[#FF453A]/30 text-[#FF453A] text-xs">
                <strong>Error:</strong> {debugError}
              </div>
            )}

            {/* Empty State */}
            {!isDebugging && !debugResult && !debugError && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-[#86868B]">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/70 mb-4 shadow-inner">
                  <svg className="w-7 h-7 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Ready to Debug</h3>
                <p className="text-xs max-w-sm text-[#86868B] leading-relaxed mb-6">
                  Paste your code on the left and click <strong>Debug & Fix Code</strong>. RepoPilot diagnoses
                  runtime errors, syntax issues, and edge cases across any language.
                </p>
                <div className="flex items-center gap-2 text-[11px] mono text-[#86868B]/80 bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl">
                  <span>Supports: Python • JS/TS • C++ • Go • Rust • Java • SQL • Shell</span>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isDebugging && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="relative w-16 h-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-[#0071E3]/20 animate-ping" />
                  <div className="w-16 h-16 rounded-full border-2 border-[#0071E3] border-t-transparent animate-spin flex items-center justify-center" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2">Diagnosing Code Architecture...</h3>
                <p className="text-xs text-[#86868B] max-w-xs leading-relaxed">
                  Scanning abstract syntax tree, checking memory safety, evaluating edge cases, and synthesizing clean fix...
                </p>
              </div>
            )}

            {/* Result Content */}
            {debugResult && !isDebugging && (
              <div className="flex-1 flex flex-col p-4 overflow-y-auto max-h-[580px]">
                {/* Tab: Clean Debugged Code */}
                {activeResultTab === 'clean' && (
                  <div className="flex flex-col gap-4">
                    {/* Bug Summary Banner */}
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                      <span className="text-base">💡</span>
                      <div>
                        <div className="text-xs font-bold text-white mb-0.5">Summary of Bugs Fixed</div>
                        <div className="text-xs text-[#A1A1A6] leading-relaxed">
                          {debugResult.bug_summary}
                        </div>
                      </div>
                    </div>

                    {/* Code Display */}
                    <div className="relative flex bg-[#0A0A0C] rounded-xl border border-white/10 overflow-hidden">
                      <div className="select-none py-3 px-3 text-right mono text-[11px] text-[#48484A] bg-[#070709] border-r border-white/5 shrink-0">
                        {Array.from({ length: resultLineCount }).map((_, i) => (
                          <div key={i} className="leading-5">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                      <pre className="flex-1 p-3 text-white font-mono text-[12px] leading-5 overflow-x-auto selection:bg-[#0071E3]/40">
                        <code>{debugResult.debugged_code}</code>
                      </pre>
                    </div>

                    {/* Quick changes list */}
                    {debugResult.changes_explained?.length > 0 && (
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="text-[11px] mono uppercase tracking-wider text-[#86868B] font-bold">
                          Key Corrections Made:
                        </div>
                        {debugResult.changes_explained.map((change, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-[#F5F5F7]">
                            <span className="text-[#30D158] font-bold">✓</span>
                            <span>{change}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Visual Diff */}
                {activeResultTab === 'diff' && (
                  <div className="flex flex-col gap-4">
                    <div className="text-xs text-[#86868B]">
                      Showing lines changed between original buggy code (<span className="text-[#FF453A]">- red</span>) and fixed code (<span className="text-[#30D158]">+ green</span>):
                    </div>
                    {debugResult.diff ? (
                      <pre className="p-4 rounded-xl bg-[#0A0A0C] border border-white/10 font-mono text-[11px] leading-5 overflow-x-auto text-white">
                        {debugResult.diff.split('\n').map((line, idx) => {
                          let colorClass = 'text-[#86868B]';
                          if (line.startsWith('+') && !line.startsWith('+++')) {
                            colorClass = 'text-[#30D158] bg-[#30D158]/10 px-1 rounded block';
                          } else if (line.startsWith('-') && !line.startsWith('---')) {
                            colorClass = 'text-[#FF453A] bg-[#FF453A]/10 px-1 rounded block';
                          } else if (line.startsWith('@@')) {
                            colorClass = 'text-[#0071E3] font-bold';
                          }
                          return (
                            <div key={idx} className={colorClass}>
                              {line || ' '}
                            </div>
                          );
                        })}
                      </pre>
                    ) : (
                      <div className="p-8 text-center text-[#86868B] text-xs">
                        No direct diff lines available. View the Clean Code tab for the complete result.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Root Cause & Analysis */}
                {activeResultTab === 'analysis' && (
                  <div className="flex flex-col gap-4">
                    {/* Root Cause Card */}
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10">
                      <div className="text-xs font-bold text-[#FF9500] mb-2 flex items-center gap-2">
                        <span>🔍</span>
                        <span>Detailed Root Cause Analysis</span>
                      </div>
                      <p className="text-xs text-[#F5F5F7] leading-relaxed whitespace-pre-wrap">
                        {debugResult.root_cause}
                      </p>
                    </div>

                    {/* Step-by-Step Changes */}
                    {debugResult.changes_explained?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                        <div className="text-xs font-bold text-white mb-2.5 flex items-center gap-2">
                          <span>🛠️</span>
                          <span>What Was Changed</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {debugResult.changes_explained.map((ch, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-xs text-[#A1A1A6]">
                              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] mono text-white shrink-0 font-bold">
                                {i + 1}
                              </span>
                              <span className="leading-5">{ch}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Best Practice Tips */}
                    {debugResult.tips && debugResult.tips.length > 0 && (
                      <div className="p-4 rounded-xl bg-[#0071E3]/10 border border-[#0071E3]/20">
                        <div className="text-xs font-bold text-[#64B5F6] mb-2 flex items-center gap-2">
                          <span>💡</span>
                          <span>Preventative Best Practices</span>
                        </div>
                        <ul className="flex flex-col gap-1.5 list-disc list-inside text-xs text-[#F5F5F7]/80">
                          {debugResult.tips.map((tip, i) => (
                            <li key={i} className="leading-relaxed">
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
