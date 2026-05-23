import { type ReactNode } from "react";
import { Stamp } from "./stamp";

/**
 * Two-column settings row: title + sub on the left, control on the right.
 * Server-component-compatible.
 */
export function SettingsRow({
  title,
  sub,
  control,
}: {
  title: string;
  sub?: string;
  control: ReactNode;
}) {
  return (
    <div
      className="grid gap-4 items-center"
      style={{
        gridTemplateColumns: "1fr auto",
        padding: "16px 0",
        borderBottom: "1px solid rgba(28,26,20,0.08)",
      }}
    >
      <div className="flex flex-col gap-1">
        <Stamp color="ink" size={11}>
          {title}
        </Stamp>
        {sub && (
          <span
            className="font-cs-display italic text-cs-ink/65"
            style={{ fontSize: 13 }}
          >
            {sub}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 justify-end">{control}</div>
    </div>
  );
}
