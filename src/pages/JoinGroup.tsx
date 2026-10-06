import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { groupService } from "../services/groupService";
import { GroupInvitePreview } from "../types";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Icons } from "../components/ui/icons";
import { toast } from "sonner";

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
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load group invite details";
        setError(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;

    if (!isAuthenticated) {
      sessionStorage.setItem("tt_join_redirect", `/join-group/${code}`);
      navigate(`/login?redirect=/join-group/${code}`);
      return;
    }

    try {
      setJoining(true);
      const res = await groupService.joinGroup(code);
      toast.success(res.message || "Joined group successfully!");
      navigate(`/group/${res.group.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to join group";
      toast.error(message);
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--danger-subtle)] text-[var(--danger)] flex items-center justify-center mx-auto">
            <Icons.Groups size={24} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Invite Link Expired or Invalid</h2>
          <p className="text-xs text-[var(--text-muted)]">{error || "This group invite link could not be found."}</p>
          <Button
            variant="primary"
            onClick={() => navigate("/dashboard")}
          >
            Go to TrustTracker
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center mx-auto">
            <Icons.Groups size={24} />
          </div>
          <Badge variant="info">Group Invitation</Badge>
          <h1 className="text-2xl font-semibold text-[var(--text)]">{preview.name}</h1>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {preview.description || "You have been invited to join this shared expense tracking group."}
          </p>
        </div>

        {/* Group Highlights Card */}
        <div className="bg-[var(--surface-muted)] border border-[var(--border)] rounded-md p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Created by:</span>
            <span className="font-semibold text-[var(--text)]">{preview.creator_name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Current Members:</span>
            <span className="font-semibold text-[var(--text)]">{preview.member_count} members</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Currency:</span>
            <span className="font-semibold font-mono text-[var(--text)]">{preview.currency || "INR"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-muted)]">Code:</span>
            <span className="font-mono font-bold text-[var(--primary)] bg-[var(--surface)] px-2 py-0.5 rounded-sm border border-[var(--border)]">
              {preview.code}
            </span>
          </div>
        </div>

        {/* User state action */}
        {isAuthenticated ? (
          <div className="space-y-3">
            <div className="p-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-md flex items-center gap-3 text-xs">
              <div className="w-7 h-7 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <p className="text-[var(--text)] font-medium">Logged in as {user?.name}</p>
                <p className="text-[var(--text-muted)] text-[11px]">{user?.email}</p>
              </div>
            </div>

            <Button
              variant="primary"
              disabled={joining}
              onClick={handleJoin}
              className="w-full justify-center"
              icon={<Icons.Forward size={16} />}
            >
              {joining ? "Joining..." : "Join Group Now"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <Button
              variant="primary"
              onClick={handleJoin}
              className="w-full justify-center"
              icon={<Icons.Forward size={16} />}
            >
              Sign In to Join Group
            </Button>

            <div className="text-center text-xs text-[var(--text-muted)] pt-2">
              New to TrustTracker?{" "}
              <Link
                to={`/register?redirect=/join-group/${code}`}
                className="font-semibold text-[var(--primary)] hover:underline"
              >
                Create an account
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
