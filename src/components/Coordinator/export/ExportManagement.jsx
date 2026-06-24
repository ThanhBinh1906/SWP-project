import { useState } from "react";
import { useSelector } from "react-redux";
import { exportHistory } from "../coordinatorMockData";
import dashboardService from "../../../services/dashboardService";
import {
  CoordinatorActionButton,
  CoordinatorBadge,
  CoordinatorPanel,
  CoordinatorTable,
  icons,
} from "../CoordinatorUI";

export function ExportManagement() {
  const eventId = useSelector((s) => s.event.activeEventId);
  const [loadingType, setLoadingType] = useState(null);
  const [error, setError] = useState("");

  const exports = [
    {
      id: "teams",
      title: "Teams CSV",
      icon: icons.Download,
      description: "All approved and pending teams",
    },
    {
      id: "excel",
      title: "Excel workbook",
      icon: icons.FileSpreadsheet,
      description: "Events, tracks, teams, and scores",
    },
    {
      id: "rbl",
      title: "Anonymous RBL data",
      icon: icons.ShieldCheck,
      description: "De-identified research export",
    },
  ];

  const handleExport = async (type) => {
    if (!eventId) {
      setError("Không tìm thấy thông tin sự kiện đang hoạt động.");
      return;
    }

    setLoadingType(type);
    setError("");

    try {
      if (type === "rbl") {
        const response = await dashboardService.downloadAnonymousRblCsv(eventId);
        
        // Lấy tên file từ header Content-Disposition
        const disposition = response.headers?.["content-disposition"] || "";
        const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^";]+)/i);
        const fileName = match?.[1]
          ? decodeURIComponent(match[1].replace(/\"/g, ""))
          : `rbl-anonymous-scores-event-${eventId}.csv`;

        const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        setError(`Chức năng xuất dữ liệu dạng "${type}" đang được phát triển.`);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải xuống dữ liệu. Vui lòng kiểm tra kết nối API.");
    } finally {
      setLoadingType(null);
    }
  };

  const columns = [
    { key: "file", label: "File" },
    { key: "type", label: "Type" },
    { key: "createdBy", label: "Created by" },
    { key: "createdAt", label: "Created at" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {exports.map((item) => {
          const Icon = item.icon;
          const isCurrentLoading = loadingType === item.id;
          return (
            <CoordinatorPanel
              key={item.title}
              title={item.title}
              subtitle={item.description}
              icon={Icon}
            >
              <CoordinatorActionButton
                variant="primary"
                icon={isCurrentLoading ? icons.Activity : icons.Download}
                disabled={loadingType !== null}
                onClick={() => handleExport(item.id)}
              >
                {isCurrentLoading ? "Exporting..." : "Export"}
              </CoordinatorActionButton>
            </CoordinatorPanel>
          );
        })}
      </div>
      <CoordinatorPanel
        title="Export history"
        subtitle="Recently generated coordinator exports"
        icon={icons.Activity}
      >
        <CoordinatorTable
          columns={columns}
          rows={exportHistory}
          renderCell={(row, key) =>
            key === "status" ? (
              <CoordinatorBadge
                tone={
                  row.status === "Ready"
                    ? "success"
                    : row.status === "Processing"
                      ? "warning"
                      : "danger"
                }
              >
                {row.status}
              </CoordinatorBadge>
            ) : (
              row[key]
            )
          }
        />
      </CoordinatorPanel>
    </div>
  );
}
