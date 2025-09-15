import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ReferralRow {
  id: string;
  invitee_email: string | null;
  created_at: string;
}

export function Discounts() {
  const [inviteCode, setInviteCode] = useState<string>("");
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [hasFirstPurchase, setHasFirstPurchase] = useState<boolean>(false);
  const [firstPurchaseUsed, setFirstPurchaseUsed] = useState<boolean>(false);
  const [referralCreditsRemaining, setReferralCreditsRemaining] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Ensure invite code exists and sync metadata
      await supabase.functions.invoke('referrals-sync', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      // Fetch invite code
      const { data: codeRow, error: codeErr } = await (supabase as any)
        .from('referral_codes')
        .select('code')
        .maybeSingle();
      if (codeErr) throw codeErr;
      setInviteCode((codeRow as any)?.code ?? "");

      // Fetch referrals list (as inviter)
      const { data: refRows, error: refErr } = await (supabase as any)
        .from('referrals')
        .select('id, invitee_email, created_at')
        .order('created_at', { ascending: false });
      if (refErr) throw refErr;
      setReferrals((refRows as ReferralRow[]) || []);

      // Fetch discounts
      const { data: discountRows, error: discErr } = await (supabase as any)
        .from('user_discounts')
        .select('id, type, consumed');
      if (discErr) throw discErr;
      const rows = (discountRows as any[]) || [];
      const firstPurchaseAvailable = rows.some(d => d.type === 'first_purchase' && !d.consumed);
      const firstPurchaseConsumed = rows.some(d => d.type === 'first_purchase' && d.consumed);
      const referralRemaining = rows.filter(d => d.type === 'referral_credit' && !d.consumed).length;
      setHasFirstPurchase(firstPurchaseAvailable);
      setFirstPurchaseUsed(!firstPurchaseAvailable && firstPurchaseConsumed);
      setReferralCreditsRemaining(referralRemaining);
    } catch (e: any) {
      console.error('Failed to load discounts data', e);
      toast.error(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast.success('Invite code copied');
    } catch (_) {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite & Discounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Your invite code</div>
              <div className="flex gap-2">
                <Input value={inviteCode} readOnly />
                <Button onClick={copyInviteCode} disabled={!inviteCode}>Copy</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Share this code. New users using it get 20% off their first payment. You earn one 20% off credit after each invited user completes their first payment.</p>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Your discount status</div>
              <div className="space-y-1 text-sm">
                <div>First-time discount: <span className="font-medium">{hasFirstPurchase ? 'Yes' : firstPurchaseUsed ? 'Used' : 'No'}</span></div>
                <div>Referral credits remaining: <span className="font-medium">{referralCreditsRemaining}</span></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Who used your invite code</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : referrals.length === 0 ? (
            <div className="text-sm text-muted-foreground">No referrals yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.invitee_email || '—'}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 