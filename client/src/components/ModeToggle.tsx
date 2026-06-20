import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    // Nếu theme đang là dark thì chuyển thành light, ngược lại (light hoặc system cũ) thì thành dark
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <button 
      onClick={toggleTheme}
      className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all overflow-hidden"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
