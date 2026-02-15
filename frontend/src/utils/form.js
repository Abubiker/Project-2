export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PASSWORD_RULES = [
  { key: "length", label: "Минимум 8 символов", test: (value) => value.length >= 8 },
  { key: "uppercase", label: "1 заглавная буква (A-Z)", test: (value) => /[A-Z]/.test(value) },
  { key: "number", label: "1 цифра (0-9)", test: (value) => /[0-9]/.test(value) },
  { key: "symbol", label: "1 символ (!@#)", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const getInputClass = (hasError) =>
  hasError
    ? "border-coral bg-coral/10 focus:outline-none focus:ring-2 focus:ring-coral/40"
    : "border-black/10";

export const normalizeString = (value) => String(value ?? "").trim();

export const validateRequired = (value) =>
  normalizeString(value) ? "" : "Обязательно к заполнению.";

export const validateEmail = (value, { required = false } = {}) => {
  const normalizedValue = normalizeString(value);
  if (!normalizedValue) {
    return required ? "Обязательно к заполнению." : "";
  }
  if (!EMAIL_REGEX.test(normalizedValue)) {
    return "Email указан неверно.";
  }
  return "";
};

export const getPasswordRuleStates = (value) => {
  const normalizedValue = String(value || "");
  return PASSWORD_RULES.map((rule) => ({
    key: rule.key,
    label: rule.label,
    ok: rule.test(normalizedValue),
  }));
};

export const getPasswordIssues = (value) => {
  const normalizedValue = String(value || "");
  return PASSWORD_RULES.filter((rule) => !rule.test(normalizedValue)).map((rule) => rule.label);
};

export const getPasswordStrengthScore = (value) =>
  getPasswordRuleStates(value).filter((rule) => rule.ok).length;
