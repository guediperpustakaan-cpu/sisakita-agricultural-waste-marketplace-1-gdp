import { ORDER_FLOW, ORDER_STATUS_LABEL, statusTone } from "@/lib/labels";

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return <span className={`badge ${statusTone(status)}`}>{label ?? status}</span>;
}

export function OrderProgress({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
        Pesanan dibatalkan
      </div>
    );
  }
  const index = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
  const percent = ((index + 1) / ORDER_FLOW.length) * 100;

  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-[#2F8F2F] transition-all"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progres pesanan ${ORDER_STATUS_LABEL[status]}`}
        />
      </div>
      <ol className="mt-2 grid grid-cols-4 gap-1 text-[10px] leading-tight sm:text-[11px]">
        {ORDER_FLOW.map((step, i) => (
          <li
            key={step}
            className={`text-center font-semibold ${
              i <= index ? "text-[#237023]" : "text-neutral-400"
            }`}
          >
            {i <= index ? "●" : "○"} {ORDER_STATUS_LABEL[step].split(" / ")[0]}
          </li>
        ))}
      </ol>
    </div>
  );
}
