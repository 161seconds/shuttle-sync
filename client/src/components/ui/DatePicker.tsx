import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
    selectedDate: string;
    onDateSelect: (date: string) => void;
}

export const DatePicker = ({ selectedDate, onDateSelect }: DatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(dayjs(selectedDate));
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset current month view to selected date when selected date changes
    useEffect(() => {
        setCurrentMonth(dayjs(selectedDate));
    }, [selectedDate]);

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMonth(prev => prev.subtract(1, 'month'));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentMonth(prev => prev.add(1, 'month'));
    };

    const generateCalendar = () => {
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        
        // dayjs() .day() returns 0 for Sunday, 1 for Monday.
        // Let's make Monday = 0, Sunday = 6 for our grid layout.
        const startDayOfWeek = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1; 

        const daysInMonth = endOfMonth.date();
        
        const days = [];
        // Add empty slots for the beginning of the month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
        }
        
        // Add actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = currentMonth.date(d).format('YYYY-MM-DD');
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === dayjs().format('YYYY-MM-DD');

            days.push(
                <button
                    key={d}
                    onClick={() => {
                        onDateSelect(dateStr);
                        setIsOpen(false);
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                        ${isSelected 
                            ? 'bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/20' 
                            : isToday 
                                ? 'border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10' 
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }
                    `}
                >
                    {d}
                </button>
            );
        }
        
        return days;
    };

    return (
        <div className="relative" ref={containerRef}>
            <div 
                className="px-4 py-2 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span className="min-w-[90px] text-center">{dayjs(selectedDate).format('DD/MM/YYYY')}</span>
            </div>

            {isOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-4 bg-gray-800 border border-gray-700 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <button 
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-white font-bold text-sm">
                            Tháng {currentMonth.format('M/YYYY')}
                        </span>
                        <button 
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                            <div key={day} className="text-[10px] font-bold text-gray-500 w-8 h-6 flex items-center justify-center">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {generateCalendar()}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-700 flex justify-center">
                        <button 
                            onClick={() => {
                                onDateSelect(dayjs().format('YYYY-MM-DD'));
                                setIsOpen(false);
                            }}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                        >
                            Chọn hôm nay
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
