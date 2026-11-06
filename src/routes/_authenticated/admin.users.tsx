import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { PageHeader, Spinner } from "@/components/app/kit";
import { Users as PageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, type UserData } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { formatDate } from "@/lib/format";
import {
  UserPlus,
  Search,
  CheckCircle2,
  ShieldAlert,
  Edit2,
  Trash2,
  UserCheck,
  Shield,
  Phone,
  CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: () => <AppShell><UsersPage /></AppShell>,
});

function UsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Create User State
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRoles, setNewRoles] = useState<string[]>(["seller"]);
  const [creating, setCreating] = useState(false);

  // Edit User State
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNationalId, setEditNationalId] = useState("");
  const [editSheba, setEditSheba] = useState("");
  const [editCard, setEditCard] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editVerified, setEditVerified] = useState(false);
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api.admin.listUsers({
        search: search.trim() || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
      });
      setUsers(data);
    } catch (err: any) {
      toast.error("خطا در دریافت کاربران: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  function openEditModal(u: UserData) {
    setEditUser(u);
    setEditName(u.profile?.full_name || "");
    setEditPhone(u.profile?.phone || "");
    setEditNationalId(u.profile?.national_id || "");
    setEditSheba(u.profile?.iban_sheba || "");
    setEditCard(u.profile?.bank_card || "");
    setEditAddress(u.profile?.default_address || "");
    setEditVerified(Boolean(u.profile?.verified));
    setEditActive(u.is_active);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setSavingEdit(true);
    try {
      await api.admin.updateUser(editUser.id, {
        full_name: editName,
        phone: editPhone,
        national_id: editNationalId,
        iban_sheba: editSheba,
        bank_card: editCard,
        default_address: editAddress,
        verified: editVerified,
        is_active: editActive,
      });
      toast.success("اطلاعات کاربر با موفقیت به‌روزرسانی شد.");
      setEditUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.admin.createUser({
        email: newEmail,
        password: newPassword,
        full_name: newName,
        phone: newPhone,
        roles: newRoles,
      });
      toast.success("کاربر جدید با موفقیت ایجاد شد.");
      setCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewPhone("");
      setNewRoles(["seller"]);
      loadUsers();
    } catch (err: any) {
      toast.error("خطا در ایجاد کاربر: " + err.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleRole(userId: string, roleName: string) {
    try {
      await api.admin.toggleRole(userId, roleName);
      toast.success("نقش کاربر به‌روزرسانی شد.");
      loadUsers();
    } catch (err: any) {
      toast.error("خطا: " + err.message);
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`آیا از حذف حساب کاربر ${email} اطمینان دارید؟ تمامی داده‌های این کاربر حذف خواهد شد.`)) {
      return;
    }
    try {
      await api.admin.deleteUser(userId);
      toast.success("کاربر حذف شد.");
      loadUsers();
    } catch (err: any) {
      toast.error("خطا در حذف: " + err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader icon={PageIcon} eyebrow="کاربران" title="مدیریت کاربران و نقش‌ها" description="مشاهده، جستجو، احراز هویت (KYC)، اعطای نقش‌های سیستمی و مدیریت دسترسی‌ها" />

        {/* Create User Button & Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <UserPlus className="w-4 h-4" />
              افزودن کاربر جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>افزودن کاربر جدید به سامانه</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
              <div>
                <Label>نام و نام خانوادگی</Label>
                <Input required value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ایمیل</Label>
                  <Input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1" dir="ltr" />
                </div>
                <div>
                  <Label>شماره موبایل</Label>
                  <Input required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="mt-1" dir="ltr" />
                </div>
              </div>
              <div>
                <Label>کلمه عبور (حداقل ۶ کاراکتر)</Label>
                <Input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label>نقش‌های اولیه</Label>
                <div className="flex gap-2 mt-1.5">
                  {[
                    { id: "seller", label: "فروشنده" },
                    { id: "expert", label: "کارشناس" },
                    { id: "admin", label: "مدیر" },
                  ].map((r) => (
                    <label key={r.id} className="flex items-center gap-1.5 text-xs bg-secondary/50 px-2.5 py-1.5 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoles.includes(r.id)}
                        onChange={(e) => {
                          if (e.target.checked) setNewRoles([...newRoles, r.id]);
                          else setNewRoles(newRoles.filter((x) => x !== r.id));
                        }}
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={creating}>
                {creating ? "در حال ایجاد..." : "ایجاد کاربر"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadUsers();
          }}
          className="flex gap-2 w-full sm:max-w-md"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3 top-3 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو با نام، ایمیل، موبایل یا کد ملی..."
              className="pr-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            جستجو
          </Button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {[
            { id: "all", label: "همه نقش‌ها" },
            { id: "seller", label: "فروشندگان" },
            { id: "expert", label: "کارشناسان" },
            { id: "admin", label: "مدیران" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                roleFilter === tab.id
                  ? "copper-fill shadow-[0_6px_18px_-8px_var(--color-primary)]"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <Spinner label="در حال بارگذاری کاربران..." />
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">کاربری با این مشخصات یافت نشد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs md:text-sm">
              <thead className="bg-foreground/[0.03] text-muted-foreground text-[11px] md:text-xs font-bold border-b border-border">
                <tr>
                  <th className="p-3 md:p-4">کاربر</th>
                  <th className="p-3 md:p-4">تماس و هویت</th>
                  <th className="p-3 md:p-4">وضعیت KYC</th>
                  <th className="p-3 md:p-4">نقش‌ها</th>
                  <th className="p-3 md:p-4">اقدامات و نقش‌ها</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isVerified = Boolean(u.profile?.verified);
                  return (
                    <tr key={u.id} className="hover:bg-primary/[0.04] transition-colors">
                      <td className="p-3 md:p-4">
                        <div className="font-bold text-foreground">
                          {u.profile?.full_name || "بدون نام"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{u.email}</div>
                        {!u.is_active && (
                          <span className="text-[10px] text-destructive font-bold bg-destructive/10 px-1.5 py-0.5 rounded">
                            مسدود شده
                          </span>
                        )}
                      </td>

                      <td className="p-3 md:p-4">
                        <div className="flex items-center gap-1 text-xs font-mono">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          {u.profile?.phone || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                          کد ملی: {u.profile?.national_id || "—"}
                        </div>
                      </td>

                      <td className="p-3 md:p-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-success/15 text-success font-medium border border-success/30">
                            <CheckCircle2 className="w-3.5 h-3.5" /> تایید شده
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
                            <ShieldAlert className="w-3.5 h-3.5" /> احراز نشده
                          </span>
                        )}
                      </td>

                      <td className="p-3 md:p-4">
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.map((r) => (
                            <span
                              key={r}
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                r === "admin"
                                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                                  : r === "expert"
                                  ? "bg-accent/15 text-accent border border-accent/30"
                                  : "bg-primary/10 text-primary border border-primary/20"
                              }`}
                            >
                              {r === "admin" ? "مدیر" : r === "expert" ? "کارشناس" : "فروشنده"}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 md:p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Edit User Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => openEditModal(u)}
                            title="ویرایش مشخصات و احراز هویت"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          {/* Quick Role Toggles */}
                          <Button
                            size="sm"
                            variant={u.roles.includes("expert") ? "default" : "outline"}
                            className="h-8 px-2 text-xs"
                            onClick={() => toggleRole(u.id, "expert")}
                          >
                            کارشناس
                          </Button>

                          <Button
                            size="sm"
                            variant={u.roles.includes("admin") ? "destructive" : "outline"}
                            className="h-8 px-2 text-xs"
                            disabled={u.id === currentAdmin?.id}
                            onClick={() => toggleRole(u.id, "admin")}
                          >
                            مدیر
                          </Button>

                          {u.id !== currentAdmin?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteUser(u.id, u.email)}
                              title="حذف کاربر"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit User & KYC Dialog */}
      {editUser && (
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ویرایش مشخصات و احراز هویت کاربر</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
              <div>
                <Label>نام و نام خانوادگی</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>شماره تماس</Label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="mt-1" dir="ltr" />
                </div>
                <div>
                  <Label>کد ملی</Label>
                  <Input value={editNationalId} onChange={(e) => setEditNationalId(e.target.value)} className="mt-1" dir="ltr" />
                </div>
              </div>

              <div>
                <Label>شماره شبا (برای تسویه بانکی)</Label>
                <Input value={editSheba} onChange={(e) => setEditSheba(e.target.value)} className="mt-1" dir="ltr" />
              </div>

              <div>
                <Label>شماره کارت بانکی</Label>
                <Input value={editCard} onChange={(e) => setEditCard(e.target.value)} className="mt-1" dir="ltr" />
              </div>

              <div>
                <Label>آدرس ثبت شده</Label>
                <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="mt-1" />
              </div>

              {/* KYC & Active Toggles */}
              <div className="p-3 bg-secondary/50 rounded-xl space-y-3">
                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="font-bold">وضعیت احراز هویت (KYC Verified)</span>
                  <input
                    type="checkbox"
                    checked={editVerified}
                    onChange={(e) => setEditVerified(e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between text-xs cursor-pointer">
                  <span className="font-bold">حساب فعال است (Active Account)</span>
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={savingEdit}>
                {savingEdit ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
