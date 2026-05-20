import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { Loading } from "@/presentation/components/ui/Loading";
import { Checkbox } from "@/presentation/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/presentation/components/ui/select";

import { fetchSettings, updateSetting } from "@/data/services/backendApi/setting";

export function SettingsPageView({ userRole}) {
  const isAdmin = userRole === "admin";
  

  // System settings state
  const [, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState({});
  const [settingsError, setSettingsError] = useState(null);

  // Editable fields state
  const [editFields, setEditFields] = useState({});

  const intervalPresets = [
    // { label: "1 second", value: "1000" },
    // { label: "10 seconds", value: "10000" },
    { label: "1 minute", value: "60000" },
    { label: "5 minutes", value: "300000" },
    { label: "10 minutes", value: "600000" },
    { label: "30 minutes", value: "1800000" },
    { label: "1 hour", value: "3600000" },
    { label: "6 hours", value: "21600000" },
    { label: "12 hours", value: "43200000" },
    { label: "24 hours", value: "86400000" },
  ];

  const reportTimePresets = [
    { label: "09:00", value: "09:00" },
    { label: "12:00", value: "12:00" },
    { label: "18:00", value: "18:00" },
  ];

  useEffect(() => {
    if (!isAdmin) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettingsLoading(true);
    fetchSettings()
      .then((data) => {
        const obj = {
            plan_charge_interval_ms: null,
            plan_grace_days: null,
            min_topup_amount: null,
            max_topup_amount: null,
            max_sim_per_customer: null,
            telegram_weekly_report_enabled: "false",
            telegram_monthly_report_enabled: "false",
            telegram_report_send_time: "09:00",
        };

        data.forEach(({ name, value }) => {
          if (Object.prototype.hasOwnProperty.call(obj, name)) {
            obj[name] = value;
          }
        });
        setSettings(obj);
        setEditFields(obj);
        setSettingsLoading(false);
      })
      .catch(() => {
        setSettingsError("Failed to load settings");
        setSettingsLoading(false);
      });
  }, [isAdmin]);

  const handleSettingChange = (key, value) => {
    setEditFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleAllSettingsSave = async () => {
    setSettingsSaving(true);
    setSettingsError(null);
    try {
      await Promise.all(
        Object.keys(editFields).map((key) =>
          updateSetting(key, editFields[key]),
        ),
      );
      setSettings(editFields);
      toast.success("Settings saved successfully!");
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setSettingsError("Failed to update settings");
      toast.error("Failed to save settings");
    }
    setSettingsSaving(false);
  };

  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-6">
        {isAdmin && (
          <div className="mt-6 space-y-4">
            <h1 className="text-lg font-semibold text-[#1f1f1f] mb-2">
              Scheduler & SIM Management
            </h1>
            {settingsLoading ? (
              <Loading message="Loading settings..." size="sm" />
            ) : (
              <>
                {settingsError && (
                  <div className="text-sm text-red-500">{settingsError}</div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#828282] mb-1">
                      Plan Charge Interval (ms)
                    </label>
                    <select
                      className="w-full rounded-md border border-[#f3f3f3] p-2"
                      value={String(editFields.plan_charge_interval_ms ?? "")}
                      onChange={(e) =>
                        handleSettingChange("plan_charge_interval_ms", e.target.value)
                      }
                      disabled={settingsSaving === true}
                    >
                      <option value="">Select interval</option>
                      {intervalPresets.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#828282] mb-1">
                      Plan Grace Days
                    </label>
                    <Input
                      type="number"
                      value={editFields.plan_grace_days || ""}
                      onChange={(e) =>
                        handleSettingChange("plan_grace_days", e.target.value)
                      }
                      min={1}
                      disabled={settingsSaving === true}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#828282] mb-1">
                      Min Top-up Amount
                    </label>
                    <Input
                      type="number"
                      value={editFields.min_topup_amount || ""}
                      onChange={(e) =>
                        handleSettingChange("min_topup_amount", e.target.value)
                      }
                      min={0}
                      disabled={settingsSaving === true}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#828282] mb-1">
                      Max Top-up Amount
                    </label>
                    <Input
                      type="number"
                      value={editFields.max_topup_amount || ""}
                      onChange={(e) =>
                        handleSettingChange("max_topup_amount", e.target.value)
                      }
                      min={0}
                      disabled={settingsSaving === true}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#828282] mb-1">
                      Max SIMs per Customer
                    </label>
                    <Input
                      type="number"
                      value={editFields.max_sim_per_customer || ""}
                      onChange={(e) =>
                        handleSettingChange(
                          "max_sim_per_customer",
                          e.target.value,
                        )
                      }
                      min={1}
                      disabled={settingsSaving === true}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-[#1f1f1f]">Telegram Reports</h4>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#828282] mb-1">
                        Send Time
                      </label>
                      <Select
                        value={editFields.telegram_report_send_time || "09:00"}
                        onValueChange={(value) =>
                          handleSettingChange("telegram_report_send_time", value)
                        }
                        disabled={settingsSaving === true}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTimePresets.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#828282] mb-1">
                        Weekly
                      </label>
                      <div className="flex items-center gap-2 rounded-md border border-[#f3f3f3] p-2 h-10">
                        <Checkbox
                          checked={String(editFields.telegram_weekly_report_enabled) === "true"}
                          onCheckedChange={(checked) =>
                            handleSettingChange(
                              "telegram_weekly_report_enabled",
                              checked === true ? "true" : "false",
                            )
                          }
                          disabled={settingsSaving === true}
                        />
                        <span className="text-sm text-[#1f1f1f]">Send weekly report</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#828282] mb-1">
                        Monthly
                      </label>
                      <div className="flex items-center gap-2 rounded-md border border-[#f3f3f3] p-2 h-10">
                        <Checkbox
                          checked={String(editFields.telegram_monthly_report_enabled) === "true"}
                          onCheckedChange={(checked) =>
                            handleSettingChange(
                              "telegram_monthly_report_enabled",
                              checked === true ? "true" : "false",
                            )
                          }
                          disabled={settingsSaving === true}
                        />
                        <span className="text-sm text-[#1f1f1f]">Send monthly report</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button
                    size="sm"
                    className={`font-semibold rounded-md ${settingsSaving === true ? "bg-gray-400" : "bg-[#1f1f1f] hover:bg-[#1f1f1f]/90"} text-white`}
                    style={{ minWidth: 120, minHeight: 40 }}
                    disabled={settingsSaving === true}
                    onClick={handleAllSettingsSave}
                  >
                    {settingsSaving === true ? "Saving..." : "Save"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


