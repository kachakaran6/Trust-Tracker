import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { groupService } from "../services/groupService";
import { GroupInvitePreview } from "../types";
import { formatCurrency } from "../utils/currency";
import { Users, ShieldCheck, ArrowRight, LogIn, UserPlus, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function JoinGroup() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [preview, setPreview] = useState<GroupInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError("Invalid or missing invite code");
      setLoading(false);
      return;
    }

    groupService
      .getInvitePreview(code)
      .then((data) => {
        setPreview(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load group invite details.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;

    if (!isAuthenticated) {
      // Store redirect target
      sessionStorage.setItem("tt_join_redirect", `/join-group/${code}`);
      navigate(`/login?redirect=/join-group/${code}`);
      return;
    }

    try {
      setJoining(true);
      const res = await groupService.joinGroup(code);
      toast.success(res.message || "Joined group successfully!");
      navigate(`/group/${res.group.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/60 rounded-3xl p-8 text-center backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold">Invite Link Expired or Invalid</h2>
          <p className="text-sm text-slate-400 mt-2 mb-6">{error || "This group invite link could not be found."}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition"
          >
            Go to Trust-Tracker
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 text-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-lg w-full bg-slate-800/80 border border-slate-700/60 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-bold rounded-full">
            GROUP INVITATION
          </span>
          <h1 className="text-3xl font-extrabold text-white">{preview.name}</h1>
          <p className="text-sm text-slate-300 max-w-sm mx-auto">
            {preview.description || "You have been invited to join this shared expense tracking group."}
          </p>
        </div>

        {/* Group Highlights Card */}
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Created by:</span>
            <span className="font-semibold text-slate-200">{preview.creator_name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Current Members:</span>
            <span className="font-semibold text-slate-200">{preview.member_count} members</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Group Currency:</span>
            <span className="font-semibold text-indigo-300 font-mono">{preview.currency || "USD"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Invite Code:</span>
            <span className="font-mono font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
              {preview.code}
            </span>
          </div>
        </div>

        {/* User state action */}
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="text-xs">
                <p className="text-slate-200 font-medium">Logged in as {user?.name}</p>
                <p className="text-slate-400">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {joining ? (
                <span>Joining group...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Accept Invite & Join Group</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleJoin}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition cursor-pointer"
            >
              <LogIn className="w-5 h-5" />
              <span>Log in to Join Group</span>
            </button>
            <Link
              to={`/register?redirect=/join-group/${code}`}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Account</span>
            </Link>
          </div>
        )}

        <div className="pt-2 text-center">
          <Link to="/" className="text-xs text-slate-400 hover:text-white transition">
            Learn more about Trust-Tracker
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
