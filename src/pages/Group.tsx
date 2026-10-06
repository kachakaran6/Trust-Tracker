import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroups } from "../hooks/useGroup";
import { useAuth } from "../contexts/AuthContext";
import { CURRENCIES, getCurrencySymbol } from "../utils/currency";
import { formatMoney } from "../lib/format";
import { toast } from "sonner";
import { usePageHeader } from "../contexts/PageHeaderContext";
import { PageHeader } from "../components/ui/PageHeader";
import { Card } from "../components/ui/Card";
import { Button, IconButton } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Icons } from "../components/ui/icons";

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setPageHeader } = usePageHeader();

  React.useEffect(() => {
    setPageHeader("Groups & Splits");
  }, [setPageHeader]);

  const { groups, loading, createGroup, joinGroup } = useGroups();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createCurrency, setCreateCurrency] = useState(user?.currency || "INR");
  const [joinCode, setJoinCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  React.useEffect(() => {
    if (user?.currency) {
      setCreateCurrency(user.currency);
    }
  }, [user?.currency]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;

    try {
      setIsSubmitting(true);
      const newGroup = await createGroup(
        createName.trim(),
        createDesc.trim() || undefined,
        createCurrency
      );
      toast.success(`Group "${newGroup.name}" created!`);
      setShowCreateModal(false);
      setCreateName("");
      setCreateDesc("");
      navigate(`/group/${newGroup.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create group";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    let cleanCode = joinCode.trim();
    if (cleanCode.includes("/join-group/")) {
      cleanCode = cleanCode.split("/join-group/").pop() || cleanCode;
    } else if (cleanCode.includes("/invite/")) {
      cleanCode = cleanCode.split("/invite/").pop() || cleanCode;
    }

    try {
      setIsSubmitting(true);
      const res = await joinGroup(cleanCode.trim().toUpperCase());
      toast.success(res.message || "Joined group!");
      setShowJoinModal(false);
      setJoinCode("");
      navigate(`/group/${res.group.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join group";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteLink = (e: React.MouseEvent, code: string, id: string) => {
    e.stopPropagation();
    const link = `${window.location.origin}/join-group/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success("Group invite link copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups & Shared Expenses"
        description="Divide flatmate rent, dinner tabs, and shared trips with transparent ledger simplification."
        secondaryActions={
          <Button
            variant="secondary"
            icon={<Icons.UserPlus size={16} />}
            onClick={() => setShowJoinModal(true)}
          >
            Join Group
          </Button>
        }
        action={
          <Button
            variant="primary"
            icon={<Icons.Add size={16} />}
            onClick={() => {
              setCreateCurrency(user?.currency || "INR");
              setShowCreateModal(true);
            }}
          >
            Create Group
          </Button>
        }
      />

      {/* Groups Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Icons.Groups size={24} />}
          title="No shared groups yet"
          description="Create a shared group for flatmates, trips, or dining outings to automatically track debts and balances."
          action={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Icons.UserPlus size={16} />}
                onClick={() => setShowJoinModal(true)}
              >
                Join with Code
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Icons.Add size={16} />}
                onClick={() => setShowCreateModal(true)}
              >
                Create Group
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const hasPendingAction = (group.myPendingSplitCount || 0) > 0;
            const netBal = group.myNetBalance || 0;

            return (
              <div
                key={group.id}
                onClick={() => navigate(`/group/${group.id}`)}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-5 shadow-xs hover:bg-[var(--surface-muted)] transition-colors flex flex-col justify-between cursor-pointer space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-base text-[var(--text)] tracking-tight truncate">
                        {group.name}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-0.5">
                        {group.description || "Shared expense group"}
                      </p>
                    </div>

                    <span className="px-2 py-0.5 bg-[var(--surface-muted)] text-[var(--text-muted)] rounded-full text-[11px] font-mono shrink-0">
                      {group.currency || "INR"}
                    </span>
                  </div>

                  {/* Balance / Status row */}
                  <div className="mt-3 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs">
                    <div>
                      <p className="text-[11px] text-[var(--text-muted)]">Your Balance</p>
                      <p
                        className={`font-semibold tabular-nums mt-0.5 ${
                          netBal > 0.01
                            ? "text-[var(--success)]"
                            : netBal < -0.01
                            ? "text-[var(--danger)]"
                            : "text-[var(--text)]"
                        }`}
                      >
                        {netBal > 0.01
                          ? `+${formatMoney(netBal, group.currency)}`
                          : netBal < -0.01
                          ? `-${formatMoney(Math.abs(netBal), group.currency)}`
                          : "Settled (₹0.00)"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] text-[var(--text-muted)]">Members</p>
                      <p className="font-medium text-[var(--text)] mt-0.5">
                        {group.member_count || group.members?.length || 1}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Invite Code Strip */}
                <div className="pt-2 flex items-center justify-between border-t border-[var(--border)] text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)]">
                    <span>CODE: {group.code}</span>
                    <button
                      type="button"
                      onClick={(e) => copyInviteLink(e, group.code, group.id)}
                      title="Copy invite link"
                      className="p-1 hover:text-[var(--text)] rounded-xs transition-colors"
                    >
                      {copiedId === group.id ? (
                        <Icons.Check size={13} className="text-[var(--success)]" />
                      ) : (
                        <Icons.Copy size={13} />
                      )}
                    </button>
                  </div>

                  {hasPendingAction && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-[var(--warning)] text-white">
                      Action needed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Shared Group"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Group Name"
            required
            placeholder="e.g. Goa Trip 2026, 4BHK Flatmates"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />

          <Textarea
            label="Description (Optional)"
            placeholder="Brief note about group purpose"
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
          />

          <Select
            label="Base Group Currency"
            value={createCurrency}
            onChange={(e) => setCreateCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol}) - {c.name}
              </option>
            ))}
          </Select>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Create Group
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Group with Invite Code"
      >
        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="Invite Code or Link"
            required
            placeholder="e.g. 8-character code or full link"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button
              variant="secondary"
              onClick={() => setShowJoinModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Join Group
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
