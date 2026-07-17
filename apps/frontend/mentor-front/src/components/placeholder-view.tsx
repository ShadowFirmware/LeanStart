"use client";

export function PlaceholderView({ title, description, icon: Icon }: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-strong)" }}>{title}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-dim)" }}>{description}</p>
      </div>

      <div
        className="rounded-2xl p-10 md:p-16 flex flex-col items-center text-center"
        style={{ backgroundColor: "var(--surface-profile)", boxShadow: "var(--shadow-card)", border: "1px dashed var(--border-hair)" }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{ backgroundColor: "rgba(154,98,250,0.08)", border: "1px solid rgba(154,98,250,0.14)" }}
        >
          <Icon className="w-5 h-5" style={{ color: "var(--brand)" }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: "var(--text-strong)" }}>Próximamente</p>
        <p className="text-sm max-w-sm" style={{ color: "var(--text-dim)" }}>
          Este módulo se construirá en una próxima iteración.
        </p>
      </div>
    </div>
  );
}
