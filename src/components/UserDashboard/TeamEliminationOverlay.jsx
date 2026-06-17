import { Lock, Trophy } from "lucide-react";

export default function TeamEliminationOverlay({
  teamName,
  reason,
  message = "Team của bạn không được vào vòng trong. Cảm ơn bạn đã tham gia cuộc thi.",
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <section className="w-full max-w-lg overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl shadow-slate-950/25">
        <div className="bg-gradient-to-r from-[#F26F21] to-[#D94B0D] px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-100">
                Vòng thi đã khép lại
              </p>
              <h2 className="mt-1 text-xl font-black">Thông báo kết quả</h2>
            </div>
          </div>
        </div>

        <div className="px-6 py-7 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-[#F26F21]">
            <Trophy className="h-8 w-8" />
          </div>

          {teamName && (
            <p className="mb-2 text-sm font-semibold text-slate-500">
              {teamName}
            </p>
          )}

          <p className="text-lg font-bold leading-7 text-slate-950">{message}</p>

          {reason && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Lý do
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{reason}</p>
            </div>
          )}

          <p className="mt-5 text-sm leading-6 text-slate-500">
            Màn hình đang được khóa để tránh thao tác nhầm sau khi team không
            còn đủ điều kiện tiếp tục thi.
          </p>
        </div>
      </section>
    </div>
  );
}
