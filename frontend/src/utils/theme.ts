export type AppTheme = "light" | "dark";
export type StudentTheme = AppTheme;
export type AdminTheme = AppTheme;

const STUDENT_SETTINGS_KEY = "userSettings";
const ADMIN_SETTINGS_KEY = "adminSettingsV2";

function isAppTheme(value: unknown): value is AppTheme {
  return value === "light" || value === "dark";
}

export function getStoredTheme(storageKey: string): AppTheme {
  if (typeof window === "undefined") return "light";

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return "light";

    const parsed = JSON.parse(raw);
    const theme = parsed?.preferences?.theme;
    return isAppTheme(theme) ? theme : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.setAttribute("data-theme", theme);
}

export function saveTheme(storageKey: string, theme: AppTheme) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : {};
    const next = {
      ...parsed,
      preferences: {
        ...parsed?.preferences,
        theme,
      },
    };
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ preferences: { theme } }),
    );
  }
}

export function getStoredStudentTheme(): StudentTheme {
  return getStoredTheme(STUDENT_SETTINGS_KEY);
}

export function applyStudentTheme(theme: StudentTheme) {
  applyTheme(theme);
}

export function saveStudentTheme(theme: StudentTheme) {
  saveTheme(STUDENT_SETTINGS_KEY, theme);
}

export function getStoredAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "dark";

  try {
    const raw = window.localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (!raw) return "dark";

    const parsed = JSON.parse(raw);
    const theme = parsed?.preferences?.theme;
    return isAppTheme(theme) ? theme : "dark";
  } catch {
    return "dark";
  }
}

export function applyAdminTheme(theme: AdminTheme) {
  applyTheme(theme);
}

export function saveAdminTheme(theme: AdminTheme) {
  saveTheme(ADMIN_SETTINGS_KEY, theme);
}
