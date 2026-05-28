'use client'

import React, { useState, useEffect } from 'react'
import { useSession, SessionProvider } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  Users,
  UserPlus,
  Mail,
  Send,
  Trash2,
  Edit,
  Search,
  Filter,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react'

function AdminDashboardClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [managers, setManagers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [sendingPassword, setSendingPassword] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE',
    managerId: '',
  })

  const [editingEmployee, setEditingEmployee] = useState(null)
  const [roleFilter, setRoleFilter] = useState('ALL')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/company/login')
    } else if (status === 'authenticated') {
      fetchEmployees()
    }
  }, [status, router])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees')
      const data = await response.json()
      setEmployees(data.employees || [])
      setManagers(data.managers || [])
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    }
  }

  const handleAddEmployee = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add employee')
      }

      setMessage({ type: 'success', text: 'Employee added successfully!' })
      setNewEmployee({ name: '', email: '', role: 'EMPLOYEE', managerId: '' })
      setShowAddModal(false)
      fetchEmployees()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSendPassword = async (employeeId, email) => {
    setSendingPassword(employeeId)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/admin/send-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password')
      }

      setMessage({ type: 'success', text: `Password sent to ${email}` })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSendingPassword(null)
    }
  }

  const handleEditEmployee = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`/api/admin/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingEmployee.name,
          email: editingEmployee.email,
          role: editingEmployee.role,
          managerId: editingEmployee.managerId || '',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update employee')
      }

      setMessage({ type: 'success', text: 'Employee updated successfully!' })
      setEditingEmployee(null)
      fetchEmployees()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (filteredEmployees.length === 0) return
    const headers = ['Name', 'Email', 'Role', 'Manager']
    const rows = filteredEmployees.map(emp => [
      emp.name || 'No Name',
      emp.email,
      emp.role,
      emp.managerName || 'No Manager'
    ])
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `employees_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    return matchesSearch && matchesRole;
  })

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/20 text-red-500 border-red-500/30'
      case 'MANAGER':
        return 'bg-amber-500/20 text-amber-500 border-amber-500/30'
      case 'FINANCE':
        return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
      case 'DIRECTOR':
        return 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30'
      case 'EMPLOYEE':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/30'
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/30 to-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-accent/20 p-3 rounded-xl">
                <Building2 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="font-playfair text-2xl md:text-3xl font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-white/70 text-sm">
                  {session?.user?.email} • Company ID: {session?.user?.companyId || 'N/A'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => router.push('/')}
            >
              Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-foreground">{employees.length}</p>
              </div>
              <div className="bg-accent/20 p-3 rounded-xl">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Managers</p>
                <p className="text-3xl font-bold text-foreground">{managers.length}</p>
              </div>
              <div className="bg-primary/20 p-3 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                <p className="text-3xl font-bold text-foreground">
                  {employees.filter(e => e.isActive).length}
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Message Display */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Employee Management Card */}
        <Card className="bg-white dark:bg-card border-border shadow-xl">
          <div className="p-6 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-playfair text-2xl font-bold text-foreground mb-1">
                  Employee Management
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add and manage your team members
                </p>
              </div>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-accent hover:bg-accent/90 text-white"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full sm:w-[180px]">
                <Select
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-background">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="DIRECTOR">Director</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="sm:w-auto bg-white dark:bg-background" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Employee Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                    Manager
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No employees found</p>
                      <Button
                        onClick={() => setShowAddModal(true)}
                        variant="link"
                        className="text-accent mt-2"
                      >
                        Add your first employee
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
                            {employee.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {employee.name || 'No Name'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(
                            employee.role
                          )}`}
                        >
                          {employee.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {employee.managerName || 'No Manager'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendPassword(employee.id, employee.email)}
                            disabled={sendingPassword === employee.id}
                            className="text-accent border-accent/30 hover:bg-accent/10"
                          >
                            {sendingPassword === employee.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Send Password
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingEmployee({
                              id: employee.id,
                              name: employee.name,
                              email: employee.email,
                              role: employee.role,
                              managerId: employee.managerId || ''
                            })}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white dark:bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-playfair text-2xl font-bold text-foreground">Add New Employee</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="john@company.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newEmployee.role}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="DIRECTOR">Director</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="manager">Assign Manager (Optional)</Label>
                <Select
                  value={newEmployee.managerId || 'none'}
                  onValueChange={(value) => setNewEmployee({ ...newEmployee, managerId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent/90 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Employee'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-white dark:bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-playfair text-2xl font-bold text-foreground">Edit Employee</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEmployee(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleEditEmployee} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editingEmployee.name || ''}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingEmployee.email}
                  onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                  placeholder="john@company.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editingEmployee.role}
                  onValueChange={(value) => setEditingEmployee({ ...editingEmployee, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="DIRECTOR">Director</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-manager">Assign Manager (Optional)</Label>
                <Select
                  value={editingEmployee.managerId || 'none'}
                  onValueChange={(value) => setEditingEmployee({ ...editingEmployee, managerId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Manager</SelectItem>
                    {managers.filter(m => m.id !== editingEmployee.id).map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingEmployee(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-accent hover:bg-accent/90 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <SessionProvider basePath="/api/auth">
      <AdminDashboardClient />
    </SessionProvider>
  )
}
