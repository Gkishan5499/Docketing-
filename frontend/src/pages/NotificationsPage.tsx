import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLawyersDiary } from "../context/LawyersDiaryContext";
import { dDiff, MSS } from "../utils/helpers";
import { Bell, Calendar, MapPin, User, CheckCircle2 } from "lucide-react";

export const NotificationsPage: React.FC = () => {
  const { deadlines, openModal } = useLawyersDiary();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState("All");

  const classified = deadlines.map((d) => {
    const diff = dDiff(d.date);
    let group: "urgent" | "soon" | "upcoming" | "past" = "upcoming";
    if (diff !== null && diff <= 3) {
      group = "urgent";
    } else if (diff !== null && diff <= 14) {
      group = "soon";
    } else if (diff !== null && diff < 0) {
      group = "past";
    }
    return { ...d, diff, group };
  });

  const filtered = classified
    .filter((d) => {
      if (filterType === "Urgent") return d.group === "urgent";
      if (filterType === "Soon") return d.group === "soon";
      if (filterType === "Upcoming") return d.group === "upcoming";
      return true;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-slate-800" />
            <h1>Urgent Hearings &amp; Statutory Alerts</h1>
          </div>
          <p>
            Real-time calendar deadlines, court appearances, limitation periods,
            and statutory alerts
          </p>
        </div>
        <div className="pa">
          <div className="flex gap-1.5">
            {["All", "Urgent", "Soon", "Upcoming"].map((tab) => (
              <button
                key={tab}
                className={`btn btn-s ${filterType === tab ? "btn-p" : "btn-g"}`}
                onClick={() => setFilterType(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="btn btn-o btn-s" onClick={() => navigate("/dkt")}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Open Calendar</span>
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="cd">
        <div className="ch">
          <span className="ct2">
            Listing Alerts ({filtered.length} scheduled)
          </span>
        </div>
        <div className="cb px-5 py-3">
          {filtered.map((d) => {
            const dt = new Date(d.date);
            const lbl =
              d.diff === 0
                ? "TODAY"
                : d.diff === 1
                  ? "Tomorrow"
                  : d.diff !== null && d.diff < 0
                    ? "OVERDUE"
                    : `${d.diff} days left`;
            const typeClass =
              d.group === "urgent" ? "ug" : d.group === "soon" ? "wa" : "ok";
            const tagClass =
              d.group === "urgent" ? "du" : d.group === "soon" ? "dw" : "dok";

            return (
              <div
                key={d.id}
                className={`np-item ${typeClass}`}
                style={{ marginBottom: "0.75rem" }}
                onClick={() => {
                  if (d.matterId) openModal("matter-detail", d.matterId);
                }}
              >
                <div style={{ textAlign: "center", minWidth: "46px" }}>
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: "1.45rem",
                      fontWeight: 700,
                      color: "var(--pr)",
                      lineHeight: 1,
                    }}
                  >
                    {dt.getDate()}
                  </div>
                  <div
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "var(--tx2)",
                    }}
                  >
                    {MSS[dt.getMonth()]}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "var(--tx)",
                    }}
                  >
                    {d.type}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--tx2)",
                      fontWeight: 500,
                    }}
                  >
                    {d.matterName}
                  </div>
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--tx3)",
                      marginTop: "0.2rem",
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                    }}
                  >
                    {d.venue && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{d.venue}</span>
                      </span>
                    )}
                    {d.attorney && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{d.attorney}</span>
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`ddys ${tagClass}`}
                  style={{ flexShrink: 0, alignSelf: "center" }}
                >
                  {lbl}
                </span>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="em">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p>No notifications matching the selected filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
