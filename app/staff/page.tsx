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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Users, Plus, Edit, Search, UserCheck, UserX, Calendar, Phone, Mail, ArrowLeft, RefreshCw } from "lucide-react"
import { dataStore } from "@/lib/data-store"
import { initializeSampleData } from "@/lib/sample-data"
import type { Staff, AttendanceRecord, Order } from "@/lib/types"

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    name: "",
    email: "",
    phone: "",
    role: "cashier",
    isActive: true,
  })
  const [activeTab, setActiveTab] = useState("staff")

  useEffect(() => {
    initializeSampleData()
    loadData()
  }, [])

  useEffect(() => {
    filterStaff()
  }, [staff, searchTerm, roleFilter, statusFilter])

  const loadData = () => {
    const staffData = dataStore.getStaff()
    const attendanceData = dataStore.getAttendanceRecords()
    const ordersData = dataStore.getOrders()
    setStaff(staffData)
    setAttendanceRecords(attendanceData)
    setOrders(ordersData)
  }

  const filterStaff = () => {
    let filtered = staff

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone.includes(searchTerm),
      )
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((member) => member.role === roleFilter)
    }

    // Filter by status
    if (statusFilter === "active") {
      filtered = filtered.filter((member) => member.isActive)
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((member) => !member.isActive)
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name))

    setFilteredStaff(filtered)
  }

  const getRoleColor = (role: Staff["role"]) => {
    switch (role) {
      case "admin":
        return "bg-purple-500 text-white"
      case "cashier":
        return "bg-blue-500 text-white"
      case "waiter":
        return "bg-green-500 text-white"
      case "chef":
        return "bg-orange-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getRoleText = (role: Staff["role"]) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "cashier":
        return "Cashier"
      case "waiter":
        return "Waiter"
      case "chef":
        return "Chef"
      default:
        return role
    }
  }

  const saveStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.phone) return

    const staffMember: Staff = {
      id: dataStore.generateId(),
      name: newStaff.name,
      email: newStaff.email,
      phone: newStaff.phone,
      role: newStaff.role as Staff["role"],
      isActive: newStaff.isActive ?? true,
      createdAt: new Date(),
    }

    dataStore.saveStaff(staffMember)
    loadData()
    setShowAddDialog(false)
    setNewStaff({
      name: "",
      email: "",
      phone: "",
      role: "cashier",
      isActive: true,
    })
  }

  const updateStaff = () => {
    if (!selectedStaff) return

    const updatedStaff: Staff = {
      ...selectedStaff,
      name: newStaff.name || selectedStaff.name,
      email: newStaff.email || selectedStaff.email,
      phone: newStaff.phone || selectedStaff.phone,
      role: (newStaff.role as Staff["role"]) || selectedStaff.role,
      isActive: newStaff.isActive ?? selectedStaff.isActive,
    }

    dataStore.saveStaff(updatedStaff)
    loadData()
    setShowEditDialog(false)
    setSelectedStaff(null)
    setNewStaff({})
  }

  const deleteStaff = (staffId: string) => {
    if (confirm("Are you sure you want to delete this staff member?")) {
      const updatedStaff = staff.filter((member) => member.id !== staffId)
      // Note: In a real implementation, you'd want to mark as inactive rather than delete
      loadData()
    }
  }

  const openEditDialog = (staffMember: Staff) => {
    setSelectedStaff(staffMember)
    setNewStaff({
      name: staffMember.name,
      email: staffMember.email,
      phone: staffMember.phone,
      role: staffMember.role,
      isActive: staffMember.isActive,
    })
    setShowEditDialog(true)
  }

  const clockIn = (staffId: string) => {
    const today = new Date().toISOString().split("T")[0]
    const existingRecord = attendanceRecords.find((record) => record.staffId === staffId && record.date === today)

    if (existingRecord && !existingRecord.clockOut) {
      alert("Staff member is already clocked in today")
      return
    }

    const attendanceRecord: AttendanceRecord = {
      id: dataStore.generateId(),
      staffId,
      date: today,
      clockIn: new Date(),
      status: "present",
    }

    dataStore.saveAttendanceRecord(attendanceRecord)
    loadData()
  }

  const clockOut = (staffId: string) => {
    const today = new Date().toISOString().split("T")[0]
    const existingRecord = attendanceRecords.find(
      (record) => record.staffId === staffId && record.date === today && !record.clockOut,
    )

    if (!existingRecord) {
      alert("No clock-in record found for today")
      return
    }

    const clockOutTime = new Date()
    const totalHours = (clockOutTime.getTime() - existingRecord.clockIn.getTime()) / (1000 * 60 * 60)

    const updatedRecord: AttendanceRecord = {
      ...existingRecord,
      clockOut: clockOutTime,
      totalHours: Math.round(totalHours * 100) / 100,
    }

    dataStore.saveAttendanceRecord(updatedRecord)
    loadData()
  }

  const getTodayAttendance = (staffId: string) => {
    const today = new Date().toISOString().split("T")[0]
    return attendanceRecords.find((record) => record.staffId === staffId && record.date === today)
  }

  const getStaffStats = (staffMember: Staff) => {
    const staffOrders = orders.filter((order) => order.staffId === staffMember.id)
    const totalSales = staffOrders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = staffOrders.length

    const staffAttendance = attendanceRecords.filter((record) => record.staffId === staffMember.id)
    const totalHours = staffAttendance.reduce((sum, record) => sum + (record.totalHours || 0), 0)

    return { totalSales, totalOrders, totalHours }
  }

  const getOverallStats = () => {
    const totalStaff = staff.length
    const activeStaff = staff.filter((member) => member.isActive).length
    const today = new Date().toISOString().split("T")[0]
    const todayAttendance = attendanceRecords.filter((record) => record.date === today)
    const presentToday = todayAttendance.filter((record) => record.status === "present").length

    return { totalStaff, activeStaff, presentToday }
  }

  const stats = getOverallStats()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <p className="text-muted-foreground">Manage staff, attendance, and performance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={loadData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.totalStaff}</div>
              <div className="text-sm text-muted-foreground">Total Staff</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeStaff}</div>
              <div className="text-sm text-muted-foreground">Active Staff</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.presentToday}</div>
              <div className="text-sm text-muted-foreground">Present Today</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="staff">Staff Directory</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Staff Directory Tab */}
          <TabsContent value="staff" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search staff by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Staff Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStaff.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Staff Found</h3>
                  <p className="text-muted-foreground">No staff members match your search criteria.</p>
                </div>
              ) : (
                filteredStaff.map((staffMember) => {
                  const todayAttendance = getTodayAttendance(staffMember.id)
                  const stats = getStaffStats(staffMember)

                  return (
                    <Card key={staffMember.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{staffMember.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleColor(staffMember.role)}>{getRoleText(staffMember.role)}</Badge>
                            <Badge variant={staffMember.isActive ? "default" : "secondary"}>
                              {staffMember.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Contact Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{staffMember.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{staffMember.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Joined: {staffMember.createdAt.toLocaleDateString()}</span>
                          </div>
                        </div>

                        <Separator />

                        {/* Performance Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                          <div>
                            <div className="font-medium">{stats.totalOrders}</div>
                            <div className="text-muted-foreground">Orders</div>
                          </div>
                          <div>
                            <div className="font-medium">{stats.totalSales.toFixed(0)} ETB</div>
                            <div className="text-muted-foreground">Sales</div>
                          </div>
                          <div>
                            <div className="font-medium">{stats.totalHours.toFixed(1)}h</div>
                            <div className="text-muted-foreground">Hours</div>
                          </div>
                        </div>

                        <Separator />

                        {/* Today's Attendance */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Today's Status:</span>
                            {todayAttendance ? (
                              <Badge variant={todayAttendance.clockOut ? "secondary" : "default"} className="text-xs">
                                {todayAttendance.clockOut ? "Clocked Out" : "Present"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Not Clocked In
                              </Badge>
                            )}
                          </div>
                          {todayAttendance && (
                            <div className="text-xs text-muted-foreground">
                              In: {todayAttendance.clockIn.toLocaleTimeString()}
                              {todayAttendance.clockOut && (
                                <>
                                  {" "}
                                  | Out: {todayAttendance.clockOut.toLocaleTimeString()} | Hours:{" "}
                                  {todayAttendance.totalHours?.toFixed(1)}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          {staffMember.isActive && (
                            <>
                              {!todayAttendance || todayAttendance.clockOut ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => clockIn(staffMember.id)}
                                  className="flex-1"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Clock In
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => clockOut(staffMember.id)}
                                  className="flex-1"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Clock Out
                                </Button>
                              )}
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(staffMember)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance Records</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {attendanceRecords
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 20)
                      .map((record) => {
                        const staffMember = staff.find((s) => s.id === record.staffId)
                        return (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div>
                                <div className="font-medium">{staffMember?.name || "Unknown Staff"}</div>
                                <div className="text-sm text-muted-foreground">{record.date}</div>
                              </div>
                            </div>
                            <div className="text-right text-sm">
                              <div>In: {record.clockIn.toLocaleTimeString()}</div>
                              {record.clockOut && <div>Out: {record.clockOut.toLocaleTimeString()}</div>}
                              {record.totalHours && (
                                <div className="font-medium">{record.totalHours.toFixed(1)} hours</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {staff
                .filter((member) => member.isActive)
                .map((staffMember) => {
                  const stats = getStaffStats(staffMember)
                  return (
                    <Card key={staffMember.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{staffMember.name}</CardTitle>
                          <Badge className={getRoleColor(staffMember.role)}>{getRoleText(staffMember.role)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{stats.totalOrders}</div>
                            <div className="text-sm text-muted-foreground">Total Orders</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{stats.totalSales.toFixed(0)}</div>
                            <div className="text-sm text-muted-foreground">Sales (ETB)</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{stats.totalHours.toFixed(1)}</div>
                            <div className="text-sm text-muted-foreground">Hours Worked</div>
                          </div>
                        </div>
                        {stats.totalOrders > 0 && (
                          <div className="text-center text-sm text-muted-foreground">
                            Average per order: {(stats.totalSales / stats.totalOrders).toFixed(2)} ETB
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={newStaff.name || ""}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newStaff.email || ""}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newStaff.phone || ""}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={newStaff.role}
                onValueChange={(value) => setNewStaff({ ...newStaff, role: value as Staff["role"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={saveStaff} className="flex-1">
                Add Staff Member
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Full Name</Label>
              <Input
                id="editName"
                value={newStaff.name || ""}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={newStaff.email || ""}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                value={newStaff.phone || ""}
                onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editRole">Role</Label>
              <Select
                value={newStaff.role}
                onValueChange={(value) => setNewStaff({ ...newStaff, role: value as Staff["role"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editActive"
                checked={newStaff.isActive ?? true}
                onChange={(e) => setNewStaff({ ...newStaff, isActive: e.target.checked })}
              />
              <Label htmlFor="editActive">Active Staff Member</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={updateStaff} className="flex-1">
                Update Staff Member
              </Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
