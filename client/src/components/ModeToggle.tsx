import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"
import { useState, useRef, useEffect } from "react"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setIsOpen(false)
          }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all overflow-hidden"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 rounded-xl shadow-lg bg-surface border border-border overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="py-1" role="menu">
            <button onClick={() => { setTheme("light"); setIsOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-surface hover:text-foreground transition-colors ${theme === 'light' ? 'text-emerald-400 font-bold bg-surface/50' : 'text-muted-foreground'}`}>Sáng</button>
            <button onClick={() => { setTheme("dark"); setIsOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-surface hover:text-foreground transition-colors ${theme === 'dark' ? 'text-emerald-400 font-bold bg-surface/50' : 'text-muted-foreground'}`}>Tối</button>
            <button onClick={() => { setTheme("system"); setIsOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm hover:bg-surface hover:text-foreground transition-colors ${theme === 'system' ? 'text-emerald-400 font-bold bg-surface/50' : 'text-muted-foreground'}`}>Hệ thống</button>
          </div>
        </div>
      )}
    </div>
  )
}
