import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'carefund_theme_mode'

function getStoredMode() {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system'
}

function resolveTheme(mode) {
    if (mode === 'dark') return 'dark'
    if (mode === 'light') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
    const [themeMode, setThemeMode] = useState(getStoredMode)
    const [theme, setTheme] = useState(() => resolveTheme(getStoredMode()))

    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)')

        const apply = () => {
            const nextTheme = resolveTheme(themeMode)
            setTheme(nextTheme)
            document.documentElement.setAttribute('data-theme', nextTheme)
        }

        apply()
        const onChange = () => {
            if (themeMode === 'system') {
                apply()
            }
        }

        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [themeMode])

    const updateThemeMode = (mode) => {
        setThemeMode(mode)
        localStorage.setItem(STORAGE_KEY, mode)
    }

    const toggleTheme = () => {
        updateThemeMode(theme === 'dark' ? 'light' : 'dark')
    }

    const value = useMemo(
        () => ({
            theme,
            themeMode,
            setThemeMode: updateThemeMode,
            toggleTheme,
            isDark: theme === 'dark',
        }),
        [theme, themeMode]
    )

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme must be used inside ThemeProvider')
    return context
}
