"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Users, Plus, Edit, Search, ArrowLeft, RefreshCw, Mail, Phone, Calendar, CheckCircle } from "lucide-react"

import { api } from "@/lib/api"

interface Staff {
  id: string; name: string; username: string; email: string; phone: string
  role: "ADMIN" | "CASHIER" | "WAITER" | "CHEF"; isActive: boolean; createdAt: string
}
interface StaffStats { totalOrders: number; totalSales: number }

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([])
  const [staffStats, setStaffStats] = useState<Record<string, StaffStats>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", role: "CASHIER", password: "", isActive: true })
  const [activeTab, setActiveTab] = useState("staff")
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [audits, setAudits] = useState<any[]>([])

  useEffect(() => { loadData(); loadPurchaseOrders(); loadAudits(); }, [])
  useEffect(() => { filterStaff() }, [staff, searchTerm, roleFilter, statusFilter])

  const loadData = async () => {
    try {
      const res = await api.get("/api/staff")
      const data: Staff[] = await res.json()
      setStaff(data)
      const sm: Record<string, StaffStats> = {}
      await Promise.all(data.map(async (m) => {
        try {
          const r = await api.get(`/api/staff/${m.id}/stats`)
          if (r.ok) { const s = await r.json(); sm[m.id] = { totalOrders: s.totalOrders, totalSales: s.totalSales } }
        } catch { sm[m.id] = { totalOrders: 0, totalSales: 0 } }
      }))
      setStaffStats(sm)
    } catch (err) { console.error("Load staff error:", err) }
  }

  const loadPurchaseOrders = async () => {
    try {
      const res = await api.get("/api/purchase-orders?status=PENDING")
      if (res.ok) setPurchaseOrders(await res.json())
    } catch(e) {}
  }
  
  const loadAudits = async () => {
    try {
      const res = await api.get("/api/inventory/audit")
      if (res.ok) setAudits(await res.json())
    } catch(e) {}
  }

  const approvePurchaseOrder = async (id: string) => {
    try {
      const res = await api.patch(`/api/purchase-orders/${id}/approve`, {})
      if (res.ok) {
        await loadPurchaseOrders()
      } else { alert("Failed to approve") }
    } catch(e) {}
  }

  const filterStaff = () => {
    let f = staff
    if (searchTerm) f = f.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.username.toLowerCase().includes(searchTerm.toLowerCase()) || m.email.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm))
    if (roleFilter !== "all") f = f.filter(m => m.role === roleFilter.toUpperCase())
    if (statusFilter === "active") f = f.filter(m => m.isActive)
    else if (statusFilter === "inactive") f = f.filter(m => !m.isActive)
    f.sort((a, b) => a.name.localeCompare(b.name))
    setFilteredStaff(f)
  }

  const roleColor = (r: string) => ({ ADMIN: "bg-purple-500 text-white", CASHIER: "bg-blue-500 text-white", WAITER: "bg-green-500 text-white", CHEF: "bg-orange-500 text-white" }[r] || "bg-gray-500 text-white")
  const roleText = (r: string) => r.charAt(0) + r.slice(1).toLowerCase()
  const stats = (id: string) => staffStats[id] || { totalOrders: 0, totalSales: 0 }

  const saveStaff = async () => {
    if (!form.name || !form.email || !form.phone || !form.username || !form.password) {
      alert("All fields are required including username and password")
      return
    }
    try {
      const res = await api.post("/api/staff", form)
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      await loadData(); setShowAddDialog(false); setForm({ name: "", username: "", email: "", phone: "", role: "CASHIER", password: "", isActive: true })
    } catch (err) { console.error(err) }
  }

  const updateStaff = async () => {
    if (!selectedStaff) return
    try {
      // Don't send empty password if not changing
      const payload = { ...form }
      if (!payload.password) delete (payload as any).password

      const res = await api.patch(`/api/staff/${selectedStaff.id}`, payload)
      if (!res.ok) { const e = await res.json(); alert(e.error); return }
      await loadData(); setShowEditDialog(false); setSelectedStaff(null)
    } catch (err) { console.error(err) }
  }

  const deleteStaff = async (id: string) => {
    if (!confirm("Deactivate this staff member?")) return
    await api.delete(`/api/staff/${id}`); await loadData()
  }

  const openEdit = (s: Staff) => { setSelectedStaff(s); setForm({ name: s.name, username: s.username, email: s.email, phone: s.phone, role: s.role, password: "", isActive: s.isActive }); setShowEditDialog(true) }


  const overall = { total: staff.length, active: staff.filter(m => m.isActive).length }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
              <div><h1 className="text-2xl font-bold">Staff Management</h1><p className="text-muted-foreground">Manage staff and performance</p></div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={loadData} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Staff</Button></DialogTrigger></Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{overall.total}</div><div className="text-sm text-muted-foreground">Total Staff</div></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{overall.active}</div><div className="text-sm text-muted-foreground">Active Staff</div></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="staff">Staff Directory</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="purchase">Purchase Approvals</TabsTrigger>
            <TabsTrigger value="audit">Inventory Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="staff" className="space-y-6">
            <Card><CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search staff..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" /></div></div>
                <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by role" /></SelectTrigger><SelectContent><SelectItem value="all">All Roles</SelectItem><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="CASHIER">Cashier</SelectItem><SelectItem value="WAITER">Waiter</SelectItem><SelectItem value="CHEF">Chef</SelectItem></SelectContent></Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select>
              </div>
            </CardContent></Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStaff.length === 0 ? (
                <div className="col-span-full text-center py-12"><Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">No Staff Found</h3><p className="text-muted-foreground">No staff members match your search criteria.</p></div>
              ) : filteredStaff.map(m => {
                const s = stats(m.id)
                return (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-lg">{m.name}</CardTitle><div className="flex items-center gap-2"><Badge className={roleColor(m.role)}>{roleText(m.role)}</Badge><Badge variant={m.isActive ? "default" : "secondary"}>{m.isActive ? "Active" : "Inactive"}</Badge></div></div></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{m.email}</span></div>
                        <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{m.phone}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Joined: {new Date(m.createdAt).toLocaleDateString()}</span></div>
                      </div>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-center text-sm">
                        <div><div className="font-medium">{s.totalOrders}</div><div className="text-muted-foreground">Orders</div></div>
                        <div><div className="font-medium">{s.totalSales.toFixed(0)} ETB</div><div className="text-muted-foreground">Sales</div></div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(m)} className="flex-1"><Edit className="h-4 w-4 mr-2" />Edit</Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {staff.filter(m => m.isActive).map(m => {
                const s = stats(m.id)
                return (
                  <Card key={m.id}><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">{m.name}</CardTitle><Badge className={roleColor(m.role)}>{roleText(m.role)}</Badge></div></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div><div className="text-2xl font-bold text-blue-600">{s.totalOrders}</div><div className="text-sm text-muted-foreground">Total Orders</div></div>
                        <div><div className="text-2xl font-bold text-green-600">{s.totalSales.toFixed(0)}</div><div className="text-sm text-muted-foreground">Sales (ETB)</div></div>
                      </div>
                      {s.totalOrders > 0 && <div className="text-center text-sm text-muted-foreground">Avg per order: {(s.totalSales / s.totalOrders).toFixed(2)} ETB</div>}
                    </CardContent></Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="purchase" className="space-y-6">
            <h2 className="text-xl font-bold">Pending Purchase Orders</h2>
            {purchaseOrders.length === 0 && <p className="text-muted-foreground">No pending purchase orders.</p>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {purchaseOrders.map(po => (
                <Card key={po.id}>
                  <CardHeader><CardTitle className="text-lg">Manager: {po.manager?.name || 'Unknown'}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-bold text-lg">Cost: {po.totalEstimatedCost} ETB</p>
                    <ul className="list-disc list-inside text-sm">
                      {po.items.map((i:any, j:number) => <li key={j}>{i.quantity}x {i.name}</li>)}
                    </ul>
                    <Button onClick={() => approvePurchaseOrder(po.id)} className="w-full mt-4 flex items-center justify-center bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve & Fund
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <h2 className="text-xl font-bold">Inventory Audit Log</h2>
            <div className="bg-card rounded-lg border overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Date</th>
                    <th className="p-3">Action Type</th>
                    <th className="p-3">Item Name</th>
                    <th className="p-3 text-right">Qty Change</th>
                    <th className="p-3">Requested By</th>
                    <th className="p-3">Approved By</th>
                  </tr>
                </thead>
                <tbody>
                  {audits.map((a:any) => (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                      <td className="p-3"><Badge variant="outline">{a.actionType}</Badge></td>
                      <td className="p-3 font-medium">{a.item?.name || 'Unknown'}</td>
                      <td className={`p-3 text-right font-bold ${a.quantityChange > 0 ? "text-green-600" : "text-red-600"}`}>
                        {a.quantityChange > 0 ? "+" : ""}{a.quantityChange}
                      </td>
                      <td className="p-3">{a.requestedBy?.name || '-'}</td>
                      <td className="p-3">{a.approvedBy?.name || '-'}</td>
                    </tr>
                  ))}
                  {audits.length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No audit logs found.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add New Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="name">Full Name</Label><Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" /></div>
            <div><Label htmlFor="username">Username</Label><Input id="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Enter username" /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter email" /></div>
            <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone" /></div>
            <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter password" /></div>
            <div><Label htmlFor="role">Role</Label><Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="CASHIER">Cashier</SelectItem><SelectItem value="WAITER">Waiter</SelectItem><SelectItem value="CHEF">Chef</SelectItem></SelectContent></Select></div>
            <div className="flex gap-2 pt-4"><Button onClick={saveStaff} className="flex-1">Add Staff Member</Button><Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Edit Staff Member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="editName">Full Name</Label><Input id="editName" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label htmlFor="editUsername">Username</Label><Input id="editUsername" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
            <div><Label htmlFor="editEmail">Email</Label><Input id="editEmail" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label htmlFor="editPhone">Phone</Label><Input id="editPhone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label htmlFor="editPassword">New Password (leave blank to keep current)</Label><Input id="editPassword" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></div>
            <div><Label htmlFor="editRole">Role</Label><Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ADMIN">Admin</SelectItem><SelectItem value="CASHIER">Cashier</SelectItem><SelectItem value="WAITER">Waiter</SelectItem><SelectItem value="CHEF">Chef</SelectItem></SelectContent></Select></div>
            <div className="flex items-center gap-2"><input type="checkbox" id="editActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /><Label htmlFor="editActive">Active Staff Member</Label></div>
            <div className="flex gap-2 pt-4"><Button onClick={updateStaff} className="flex-1">Update Staff Member</Button><Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
