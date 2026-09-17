export const formatDate = (value) => {
    if (!value) return "No due date";

    return new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

export const dueLabel = (value) => {
    if (!value) return { text: "No due date", tone: "neutral" };

    const diff = new Date(value).getTime() - Date.now();
    const days = Math.round(diff / 86400000);
    const hours = Math.round(diff / 3600000);

    if (diff < 0) return { text: "Past due", tone: "danger" };
    if (hours <= 24)
        return { text: `Due in ${Math.max(hours, 1)}h`, tone: "danger" };
    if (days <= 3) return { text: `Due in ${days} days`, tone: "warn" };

    return { text: `Due in ${days} days`, tone: "neutral" };
};

export const toIso = (localValue) =>
    localValue ? new Date(localValue).toISOString() : null;

export const toLocalInput = (iso) => {
    if (!iso) return "";

    const date = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
        date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const initials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("");