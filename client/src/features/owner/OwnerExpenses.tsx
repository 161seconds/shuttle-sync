import React, { useState, useEffect } from 'react';
import { ownerApi } from '../../services/ownerApi';
import { PageTransition } from '../../components/ui/PageTransition';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { Loader2, Plus, Edit2, Trash2, Calendar, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { CustomSelect } from '../../components/ui/CustomSelect';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const CATEGORIES = [
    'Mặt bằng',
    'Điện Nước',
    'Nhân sự',
    'Bảo trì',
    'Marketing',
    'Khác'
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export const OwnerExpenses = () => {
    const [expenses, setExpenses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [formData, setFormData] = useState({
        amount: '',
        category: 'Điện Nước',
        date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const data = await ownerApi.getExpenses(month, year);
            setExpenses(data);
        } catch (error) {
            console.error('Failed to fetch expenses', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [month, year]);

    const handleOpenModal = (expense?: any) => {
        if (expense) {
            setEditingExpense(expense);
            setFormData({
                amount: expense.amount.toString(),
                category: expense.category,
                date: new Date(expense.date).toISOString().split('T')[0],
                description: expense.description || ''
            });
        } else {
            setEditingExpense(null);
            setFormData({
                amount: '',
                category: 'Điện Nước',
                date: new Date().toISOString().split('T')[0],
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                amount: parseFloat(formData.amount)
            };
            
            if (editingExpense) {
                await ownerApi.updateExpense(editingExpense._id, data);
            } else {
                await ownerApi.createExpense(data);
            }
            
            setIsModalOpen(false);
            fetchExpenses();
        } catch (error) {
            console.error('Submit error', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) {
            try {
                await ownerApi.deleteExpense(id);
                fetchExpenses();
            } catch (error) {
                console.error('Delete error', error);
            }
        }
    };

    const expensesByCategory = Object.entries(
        expenses.reduce((acc: any, e: any) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name, value }));

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <PageTransition className="p-8 max-w-7xl mx-auto space-y-8">
            <ScrollReveal className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <TrendingDown className="w-8 h-8 text-rose-500" />
                        Quản Lý Chi Phí
                    </h1>
                    <p className="text-gray-400 mt-1">Ghi nhận các khoản thu chi, điện nước, nhân sự</p>
                </div>
                
                <div className="flex gap-4">
                    <CustomSelect
                        value={month}
                        onChange={(val) => setMonth(parseInt(val))}
                        options={Array.from({ length: 12 }).map((_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))}
                        className="w-32"
                    />
                    <CustomSelect
                        value={year}
                        onChange={(val) => setYear(parseInt(val))}
                        options={[year - 1, year, year + 1].map(y => ({ value: y, label: `Năm ${y}` }))}
                        className="w-32"
                    />
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Thêm Khoản Chi
                    </button>
                </div>
            </ScrollReveal>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Danh sách chi phí tháng {month}/{year}</h2>
                            <div className="text-xl font-bold text-rose-500">
                                {formatCurrency(totalExpense)}
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-gray-400 text-sm">
                                    <tr>
                                        <th className="p-4 font-medium whitespace-nowrap">Ngày</th>
                                        <th className="p-4 font-medium">Hạng mục</th>
                                        <th className="p-4 font-medium">Số tiền</th>
                                        <th className="p-4 font-medium">Ghi chú</th>
                                        <th className="p-4 font-medium text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                Không có khoản chi nào trong tháng này.
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((expense) => (
                                            <tr key={expense._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="p-4 whitespace-nowrap text-gray-300">
                                                    {format(new Date(expense.date), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    <span className="bg-white/10 px-3 py-1 rounded-full text-sm">
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-rose-400">
                                                    {formatCurrency(expense.amount)}
                                                </td>
                                                <td className="p-4 text-gray-400 max-w-[200px] truncate" title={expense.description}>
                                                    {expense.description || '-'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button 
                                                        onClick={() => handleOpenModal(expense)}
                                                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(expense._id)}
                                                        className="p-2 text-gray-400 hover:text-rose-400 transition-colors ml-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-[#0a0f16]/60 backdrop-blur-3xl border border-white/5 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Phân bổ chi phí</h2>
                        {expensesByCategory.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={expensesByCategory}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {expensesByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                Chưa có dữ liệu
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingExpense ? 'Sửa khoản chi' : 'Thêm khoản chi'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Số tiền (VNĐ)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({...formData, amount: e.target.value})}
                                    className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500"
                                    placeholder="Ví dụ: 1000000"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Hạng mục</label>
                                <CustomSelect
                                    value={formData.category}
                                    onChange={val => setFormData({...formData, category: val})}
                                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Ngày chi</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 [color-scheme:dark]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Ghi chú (Tùy chọn)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="w-full bg-[#0a0f16] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 resize-none h-24"
                                    placeholder="Thanh toán tiền điện tháng này..."
                                />
                            </div>
                            
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-colors font-medium"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                                >
                                    {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {editingExpense ? 'Cập nhật' : 'Thêm mới'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </PageTransition>
    );
};
