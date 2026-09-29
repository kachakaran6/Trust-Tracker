import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGroups } from "../hooks/useGroup";
import { useAuth } from "../contexts/AuthContext";
import { CURRENCIES, formatCurrency, getCurrencySymbol } from "../utils/currency";
import { Dropdown } from "../components/ui/Dropdown";
import {
  Users,
  Plus,
  UserPlus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Share2,
  Wallet,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const currencyOptions = CURRENCIES.map((c) => ({
    value: c.code,
    label: `${c.flag || ""} ${c.code} (${c.symbol}) - ${c.name}`,
    badge: c.symbol,
  }));

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
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    // Handle full invite link pasted
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
    } catch (err: any) {
      toast.error(err.message || "Failed to join group");
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
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-500" />
            Shared Groups & Expense Splitting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Splitwise-style expense sharing, min-cash-flow debt settling, and instant group invites
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Join Group
          </button>
          <button
            onClick={() => {
              setCreateCurrency(user?.currency || "INR");
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 active:scale-[0.98] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Shared Groups Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            Create a group for trips, flatmates, dining outings, or projects to split expenses smoothly and auto-calculate who owes whom!
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm cursor-pointer"
            >
              Create Your First Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const groupCurrency = group.currency || user?.currency || "USD";
            const isCopied = copiedId === group.id;

            return (
              <motion.div
                key={group.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/group/${group.id}`)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-400/50 transition flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-primary-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-md text-xs font-mono font-bold border border-sky-100 dark:border-sky-900">
                        {groupCurrency}
                      </span>
                      {group.my_role === "admin" && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-bold">
                          ADMIN
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-sky-400 transition">
                    {group.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                    {group.description || "Shared group expense ledger"}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Group Spending</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(group.total_spent || 0, groupCurrency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Members</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {group.member_count || 1} {group.member_count === 1 ? "person" : "people"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={(e) => copyInviteLink(e, group.code, group.id)}
                      className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{isCopied ? "Link Copied!" : "Share Invite Link"}</span>
                    </button>

                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 group-hover:text-primary-600 dark:group-hover:text-sky-400 transition">
                      View Group <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Group */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-500" />
                  Create New Split Group
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Goa Trip 2026, Apartment 4B, Friday Dinner"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={createDesc}
                    onChange={(e) => setCreateDesc(e.target.value)}
                    placeholder="Shared accommodation and expenses"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <Dropdown
                    label="Group Currency"
                    options={currencyOptions}
                    value={createCurrency}
                    onChange={setCreateCurrency}
                    searchable
                    searchPlaceholder="Search currency..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create Group"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Join Group */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-sky-500" />
                  Join Group with Link or Code
                </h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Group Code or Invite Link
                  </label>
                  <input
                    type="text"
                    required
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. 7A8B9C or https://.../join-group/7A8B9C"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ask your friend or group admin for their 6-character group code or paste the invite link here.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Joining..." : "Join Group"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
