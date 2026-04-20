import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";

import { fetchSettings, updateSetting } from "@/data/services/backendApi/setting";

export function SettingsPageView({ userRole, onAddBranch }) {
  const isAdmin = userRole === "admin";
  const [branchForm, setBranchForm] = useState({ name: "", location: "" });
  const [addingBranch, setAddingBranch] = useState(false);

  // System settings state
  const [, setSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState({});
  const [settingsError, setSettingsError] = useState(null);

  // Editable fields state
  const [editFields, setEditFields] = useState({});

  const intervalPresets = [
    { label: "Test (1s)", value: "1000" },
    { label: "10,000 ms (10s)", value: "10000" },
    { label: "60,000 ms (1m)", value: "60000" },
    { label: "300,000 ms (5m)", value: "300000" },
  ];

  useEffect(() => {
    if (!isAdmin) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettingsLoading(true);
    fetchSettings()
      .then((data) => {
        const obj = {};
        data.forEach(({ name, value }) => {
          obj[name] = value;
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

  const handleAddBranch = async () => {
    if (!isAdmin || typeof onAddBranch !== "function") {
      return;
    }
    if (!branchForm.name.trim()) {
      return;
    }

    setAddingBranch(true);
    const success = await onAddBranch({
      name: branchForm.name.trim(),
      location: branchForm.location.trim(),
    });
    setAddingBranch(false);

    if (success) {
      setBranchForm({ name: "", location: "" });
    }
  };
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#1f1f1f] mb-1">
          System Settings
        </h2>
        <p className="text-sm text-[#828282]">Configure admin features.</p>
        {isAdmin && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-[#1f1f1f] mb-2">
              Scheduler & SIM Management
            </h3>
            {settingsLoading ? (
              <div className="text-sm text-[#828282]">Loading settings...</div>
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
      <div className="bg-white rounded-xl border border-[#f3f3f3] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-[#1f1f1f]" />
          <h3 className="font-semibold text-[#1f1f1f]">Branch Management</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Branch name"
            value={branchForm.name}
            disabled={!isAdmin || addingBranch}
            onChange={(event) =>
              setBranchForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <Input
            placeholder="Location (optional)"
            value={branchForm.location}
            disabled={!isAdmin || addingBranch}
            onChange={(event) =>
              setBranchForm((prev) => ({
                ...prev,
                location: event.target.value,
              }))
            }
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleAddBranch}
            disabled={
              !isAdmin || addingBranch || branchForm.name.trim().length < 2
            }
            className="bg-[#1f1f1f] hover:bg-[#1f1f1f]/90"
          >
            {addingBranch ? "Adding..." : "Add Branch"}
          </Button>
        </div>

        {!isAdmin && (
          <p className="text-sm text-[#f6a94c] mt-3">
            Only administrators can add branches.
          </p>
        )}
      </div>
    </div>
  );
}


